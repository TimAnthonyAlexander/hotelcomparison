<?php

namespace App\Import\Contracts;

use App\Import\DTOs\HotelDTO;
use App\Import\DTOs\OfferDTO;
use App\Import\DTOs\RatingDTO;
use App\Models\Hotel;
use App\Models\Room;
use App\Models\Offer;

interface MapperInterface
{
    /**
     * Map HotelDTO to Hotel model
     */
    public function mapHotel(HotelDTO $dto, string $source): Hotel;

    /**
     * Map OfferDTO to Room and Offer models
     * 
     * @return array{room: Room, offer: Offer}
     */
    public function mapOffer(OfferDTO $dto, string $source, Hotel $hotel): array;

    /**
     * Apply rating data to hotel
     */
    public function applyRating(Hotel $hotel, RatingDTO $rating): void;
}
