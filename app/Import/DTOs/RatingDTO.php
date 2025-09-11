<?php

namespace App\Import\DTOs;

class RatingDTO
{
    public function __construct(
        public readonly string $hotelId,
        public readonly float $overallRating,
        public readonly ?array $categoryRatings = null,
        public readonly ?int $numberOfReviews = null
    ) {}
}
