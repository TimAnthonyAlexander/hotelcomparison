<?php

namespace App\Import\Contracts;

use App\Import\DTOs\HotelDTO;
use App\Import\DTOs\OfferDTO;
use App\Import\DTOs\RatingDTO;
use App\Import\DTOs\AccessTokenDTO;

interface ProviderInterface
{
    /**
     * Authenticate with the provider and get access token
     */
    public function authenticate(): AccessTokenDTO;

    /**
     * List hotels by city code, geocode, or hotel IDs
     * 
     * @param array $scope Array with keys like 'cityCode', 'latitude', 'longitude', 'hotelIds', etc.
     * @return HotelDTO[]
     */
    public function listHotels(array $scope): array;

    /**
     * List offers for given hotels and search parameters
     * 
     * @param array $hotelIds
     * @param array $searchParams Array with keys like 'checkInDate', 'checkOutDate', 'adults', 'rooms'
     * @return OfferDTO[]
     */
    public function listOffers(array $hotelIds, array $searchParams): array;

    /**
     * Get ratings for hotels (optional)
     * 
     * @param array $hotelIds
     * @return RatingDTO[]
     */
    public function ratings(array $hotelIds): array;

    /**
     * Get the provider name
     */
    public function getProviderName(): string;
}
