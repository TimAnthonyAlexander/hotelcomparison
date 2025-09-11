<?php

namespace App\Import\Services;

use App\Import\Contracts\ProviderInterface;
use App\Import\Contracts\MapperInterface;
use App\Models\Hotel;
use App\Models\Room;
use App\Models\Offer;
use BaseApi\Database\DB;
use Exception;

class ImportOrchestrator
{
    private array $seenOfferIds = [];
    
    public function __construct(
        private readonly ProviderInterface $provider,
        private readonly MapperInterface $mapper,
        private readonly array $config = []
    ) {}

    /**
     * Run a complete import job for the given scope
     * 
     * @param array $scope Array with keys like 'cityCode', 'latitude', 'longitude', 'hotelIds'
     * @param array $searchParams Array with keys like 'checkInDate', 'checkOutDate', 'adults', 'rooms'
     */
    public function runImport(array $scope, array $searchParams): array
    {
        $stats = [
            'hotels_processed' => 0,
            'hotels_created' => 0,
            'hotels_updated' => 0,
            'rooms_processed' => 0,
            'rooms_created' => 0,
            'rooms_updated' => 0,
            'offers_processed' => 0,
            'offers_created' => 0,
            'offers_updated' => 0,
            'offers_deactivated' => 0,
            'errors' => []
        ];

        try {
            // Phase A: Import hotel catalog
            echo "Phase A: Importing hotel catalog...\n";
            $hotels = $this->importHotels($scope, $stats);
            
            // Phase B: Import ratings (optional)
            if (!empty($hotels) && ($this->config['import_ratings'] ?? true)) {
                echo "Phase B: Importing hotel ratings...\n";
                $this->importRatings($hotels, $stats);
            }
            
            // Phase C: Import offers and rooms
            if (!empty($hotels)) {
                echo "Phase C: Importing offers and rooms...\n";
                $this->importOffers($hotels, $searchParams, $stats);
            }
            
            // Phase D: Reconcile stale offers
            echo "Phase D: Reconciling stale offers...\n";
            $this->reconcileStaleOffers($stats);
            
        } catch (Exception $e) {
            $stats['errors'][] = $e->getMessage();
            echo "Import failed: " . $e->getMessage() . "\n";
        }

        return $stats;
    }

    private function importHotels(array $scope, array &$stats): array
    {
        $hotelDTOs = $this->provider->listHotels($scope);
        $hotels = [];
        
        foreach ($hotelDTOs as $hotelDTO) {
            try {
                $result = $this->upsertHotel($hotelDTO);
                $hotels[] = $result['hotel'];
                $stats['hotels_processed']++;
                
                if ($result['created']) {
                    $stats['hotels_created']++;
                } else {
                    $stats['hotels_updated']++;
                }
                
            } catch (Exception $e) {
                $stats['errors'][] = "Hotel {$hotelDTO->externalId}: " . $e->getMessage();
            }
        }
        
        return $hotels;
    }

    private function importRatings(array $hotels, array &$stats): void
    {
        $hotelIds = array_map(fn($hotel) => $hotel->external_id, $hotels);
        $ratingDTOs = $this->provider->ratings($hotelIds);
        
        $ratingsMap = [];
        foreach ($ratingDTOs as $rating) {
            $ratingsMap[$rating->hotelId] = $rating;
        }
        
        foreach ($hotels as $hotel) {
            if (isset($ratingsMap[$hotel->external_id])) {
                $this->mapper->applyRating($hotel, $ratingsMap[$hotel->external_id]);
                $hotel->save();
            }
        }
    }

    private function importOffers(array $hotels, array $searchParams, array &$stats): void
    {
        $hotelIds = array_map(fn($hotel) => $hotel->external_id, $hotels);
        $hotelMap = [];
        foreach ($hotels as $hotel) {
            $hotelMap[$hotel->external_id] = $hotel;
        }
        
        $offerDTOs = $this->provider->listOffers($hotelIds, $searchParams);
        
        foreach ($offerDTOs as $offerDTO) {
            try {
                if (!isset($hotelMap[$offerDTO->hotelId])) {
                    continue;
                }
                
                $hotel = $hotelMap[$offerDTO->hotelId];
                $result = $this->mapper->mapOffer($offerDTO, $this->provider->getProviderName(), $hotel);
                
                $roomResult = $this->upsertRoom($result['room']);
                $result['offer']->room = $roomResult['room'];
                
                $offerResult = $this->upsertOffer($result['offer']);
                
                // Track seen offers for reconciliation
                $this->seenOfferIds[] = $offerResult['offer']->external_id;
                
                $stats['offers_processed']++;
                if ($offerResult['created']) {
                    $stats['offers_created']++;
                } else {
                    $stats['offers_updated']++;
                }
                
                $stats['rooms_processed']++;
                if ($roomResult['created']) {
                    $stats['rooms_created']++;
                } else {
                    $stats['rooms_updated']++;
                }
                
            } catch (Exception $e) {
                $stats['errors'][] = "Offer {$offerDTO->offerId}: " . $e->getMessage();
            }
        }
    }

    private function reconcileStaleOffers(array &$stats): void
    {
        if (empty($this->seenOfferIds)) {
            return;
        }
        
        $source = $this->provider->getProviderName();
        
        // Find offers from this provider that weren't seen in this run
        $placeholders = str_repeat('?,', count($this->seenOfferIds) - 1) . '?';
        $sql = "UPDATE offers SET is_active = 0 WHERE source = ? AND external_id NOT IN ($placeholders) AND is_active = 1";
        
        $params = array_merge([$source], $this->seenOfferIds);
        $affected = DB::statement($sql, $params);
        
        $stats['offers_deactivated'] = $affected;
    }

    private function upsertHotel(\App\Import\DTOs\HotelDTO $hotelDTO): array
    {
        $source = $this->provider->getProviderName();
        
        // Try to find existing hotel
        $existing = Hotel::where('source', '=', $source)
            ->where('external_id', '=', $hotelDTO->externalId)
            ->first();
        
        if ($existing) {
            // Update existing
            $hotel = $this->mapper->mapHotel($hotelDTO, $source);
            $hotel->id = $existing->id;
            $hotel->save();
            return ['hotel' => $hotel, 'created' => false];
        } else {
            // Create new
            $hotel = $this->mapper->mapHotel($hotelDTO, $source);
            $hotel->save();
            return ['hotel' => $hotel, 'created' => true];
        }
    }

    private function upsertRoom(Room $room): array
    {
        // Try to find existing room
        $existing = Room::where('source', '=', $room->source)
            ->where('external_id', '=', $room->external_id)
            ->first();
        
        if ($existing) {
            // Update existing
            $existing->title = $room->title;
            $existing->type = $room->type;
            $existing->capacity = $room->capacity;
            $existing->hotel = $room->hotel;
            $existing->save();
            return ['room' => $existing, 'created' => false];
        } else {
            // Create new
            $room->save();
            return ['room' => $room, 'created' => true];
        }
    }

    private function upsertOffer(Offer $offer): array
    {
        // Try to find existing offer
        $existing = Offer::where('source', '=', $offer->source)
            ->where('external_id', '=', $offer->external_id)
            ->first();
        
        if ($existing) {
            // Update existing
            $existing->price = $offer->price;
            $existing->currency = $offer->currency;
            $existing->check_in_date = $offer->check_in_date;
            $existing->check_out_date = $offer->check_out_date;
            $existing->room = $offer->room;
            $existing->last_seen_at = $offer->last_seen_at;
            $existing->is_active = $offer->is_active;
            $existing->save();
            return ['offer' => $existing, 'created' => false];
        } else {
            // Create new
            $offer->save();
            return ['offer' => $offer, 'created' => true];
        }
    }
}
