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
        $room->hotel = $hotel;
        $room->source = $source;
        $room->external_id = $this->generateRoomExternalId($dto->hotelId, $dto->room);

        // Create offer
        $offer = new Offer();
        $offer->price = $dto->price;
        $offer->currency = $dto->currency;
        $offer->check_in_date = $dto->checkInDate;
        $offer->check_out_date = $dto->checkOutDate;
        $offer->room = $room;
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
        $roomKey = $hotelId . '_' . $room->getNormalizedType();
        
        // Add description hash if available for more uniqueness
        if (!empty($room->description)) {
            $roomKey .= '_' . substr(md5($room->description), 0, 8);
        }
        
        return $roomKey;
    }
}
