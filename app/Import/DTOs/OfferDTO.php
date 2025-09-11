<?php

namespace App\Import\DTOs;

class OfferDTO
{
    public function __construct(
        public readonly string $hotelId,
        public readonly string $offerId,
        public readonly float $price,
        public readonly string $currency,
        public readonly string $checkInDate,
        public readonly string $checkOutDate,
        public readonly RoomDTO $room,
        public readonly ?array $policies = null,
        public readonly ?array $cancellation = null
    ) {}
}
