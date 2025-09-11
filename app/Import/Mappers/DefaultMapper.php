<?php

namespace App\Import\Mappers;

use App\Import\Contracts\MapperInterface;
use App\Import\DTOs\HotelDTO;
use App\Import\DTOs\OfferDTO;
use App\Import\DTOs\RatingDTO;
use App\Models\Hotel;
use App\Models\Room;
use App\Models\Offer;

class DefaultMapper implements MapperInterface
{
    public function mapHotel(HotelDTO $dto, string $source): Hotel
    {
        $hotel = new Hotel();
        $hotel->title = $this->normalizeTitle($dto->name);
        $hotel->address = $dto->getFormattedAddress();
        $hotel->rating = $dto->rating ?? 0.0;
        $hotel->description = $dto->description ?? '';
        $hotel->source = $source;
        $hotel->external_id = $dto->externalId;

        return $hotel;
    }

    public function mapOffer(OfferDTO $dto, string $source, Hotel $hotel): array
    {
        // Create or find room
        $room = new Room();
        $room->title = $dto->room->getTitle();
        $room->type = $dto->room->getNormalizedType();
        $room->capacity = $dto->room->getCapacity();
        $room->hotel_id = $hotel->id;
        $room->source = $source;
        $room->external_id = $this->generateRoomExternalId($dto->hotelId, $dto->room);

        // Create offer (room will be set after room is saved)
        $offer = new Offer();
        $offer->price = $dto->price;
        $offer->currency = $dto->currency;
        $offer->check_in_date = $dto->checkInDate;
        $offer->check_out_date = $dto->checkOutDate;
        $offer->source = $source;
        $offer->external_id = $dto->offerId;
        $offer->last_seen_at = date('Y-m-d H:i:s');
        $offer->is_active = true;

        return [
            'room' => $room,
            'offer' => $offer
        ];
    }

    public function applyRating(Hotel $hotel, RatingDTO $rating): void
    {
        $hotel->rating = $rating->overallRating;
    }

    private function normalizeTitle(string $title): string
    {
        // Convert to title case and clean up
        $title = trim($title);
        $title = ucwords(strtolower($title));
        
        // Handle common hotel chain patterns
        $title = preg_replace('/\bHotel\b/i', 'Hotel', $title);
        $title = preg_replace('/\bInn\b/i', 'Inn', $title);
        $title = preg_replace('/\bResort\b/i', 'Resort', $title);
        
        return $title;
    }

    private function generateRoomExternalId(string $hotelId, \App\Import\DTOs\RoomDTO $room): string
    {
        // Create a stable external ID for the room based on hotel and room characteristics
        // Following the pattern: amadeus:hotelId:roomKey where roomKey is deterministic hash
        
        $components = [
            $hotelId,
            $this->normalizeString($room->getNormalizedType()),
            $this->normalizeString($room->description)
        ];
        
        // Add capacity if available for better differentiation
        if ($room->getCapacity() > 0) {
            $components[] = 'cap' . $room->getCapacity();
        }
        
        // Add bed information if available from typeEstimated
        if (!empty($room->typeEstimated['beds'])) {
            $components[] = 'beds' . $room->typeEstimated['beds'];
        }
        
        // Create deterministic hash from all components
        $roomKey = substr(md5(implode('|', array_filter($components))), 0, 12);
        
        return $hotelId . '_' . $roomKey;
    }
    
    private function normalizeString(string $text): string
    {
        // Normalize strings for consistent hashing
        $text = trim(strtolower($text));
        $text = preg_replace('/\s+/', ' ', $text); // Collapse whitespace
        $text = preg_replace('/[^a-z0-9\s]/', '', $text); // Remove special chars
        return $text;
    }
}
