<?php

namespace App\Import\Providers;

use App\Import\Contracts\ProviderInterface;
use App\Import\DTOs\AccessTokenDTO;
use App\Import\DTOs\HotelDTO;
use App\Import\DTOs\OfferDTO;
use App\Import\DTOs\RatingDTO;
use App\Import\DTOs\RoomDTO;
use Exception;

class AmadeusProvider implements ProviderInterface
{
    private const TEST_BASE_URL = 'https://test.api.amadeus.com';
    private const PROD_BASE_URL = 'https://api.amadeus.com';
    
    private ?AccessTokenDTO $accessToken = null;
    
    public function __construct(
        private readonly string $clientId,
        private readonly string $clientSecret,
        private readonly bool $isTest = true,
        private readonly int $maxHotelIdsPerCall = 50
    ) {}

    public function authenticate(): AccessTokenDTO
    {
        if ($this->accessToken && !$this->accessToken->isExpired()) {
            return $this->accessToken;
        }

        $url = $this->getBaseUrl() . '/v1/security/oauth2/token';
        
        $data = [
            'grant_type' => 'client_credentials',
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret
        ];

        $response = $this->makeRequest('POST', $url, $data, [
            'Content-Type: application/x-www-form-urlencoded'
        ]);

        if (!isset($response['access_token'])) {
            throw new Exception('Failed to authenticate with Amadeus API');
        }

        $this->accessToken = new AccessTokenDTO(
            token: $response['access_token'],
            expiresIn: time() + ($response['expires_in'] ?? 3600),
            tokenType: $response['token_type'] ?? 'Bearer'
        );

        return $this->accessToken;
    }

    public function listHotels(array $scope): array
    {
        $token = $this->authenticate();
        $hotels = [];

        if (isset($scope['cityCode'])) {
            $hotels = array_merge($hotels, $this->listHotelsByCity($scope['cityCode'], $token));
        }

        if (isset($scope['latitude'], $scope['longitude'])) {
            $hotels = array_merge($hotels, $this->listHotelsByGeocode(
                $scope['latitude'], 
                $scope['longitude'], 
                $token,
                $scope['radius'] ?? 50
            ));
        }

        if (isset($scope['hotelIds'])) {
            // For specific hotel IDs, we might need to fetch them differently
            // This would require additional API calls or different endpoints
        }

        return $hotels;
    }

    public function listOffers(array $hotelIds, array $searchParams): array
    {
        $token = $this->authenticate();
        $offers = [];

        // Process in batches to respect API limits
        $batches = array_chunk($hotelIds, $this->maxHotelIdsPerCall);

        foreach ($batches as $batch) {
            $batchOffers = $this->fetchOffersForHotels($batch, $searchParams, $token);
            $offers = array_merge($offers, $batchOffers);
            
            // Add delay to respect rate limits
            usleep(100000); // 100ms delay
        }

        return $offers;
    }

    public function ratings(array $hotelIds): array
    {
        $token = $this->authenticate();
        $ratings = [];

        // Process in batches
        $batches = array_chunk($hotelIds, $this->maxHotelIdsPerCall);

        foreach ($batches as $batch) {
            $batchRatings = $this->fetchRatingsForHotels($batch, $token);
            $ratings = array_merge($ratings, $batchRatings);
            
            usleep(100000); // 100ms delay
        }

        return $ratings;
    }

    public function getProviderName(): string
    {
        return 'amadeus';
    }

    private function listHotelsByCity(string $cityCode, AccessTokenDTO $token): array
    {
        $url = $this->getBaseUrl() . '/v1/reference-data/locations/hotels/by-city';
        $params = [
            'cityCode' => $cityCode,
            'radius' => 50,
            'radiusUnit' => 'KM'
        ];

        $response = $this->makeRequest('GET', $url . '?' . http_build_query($params), null, [
            'Authorization: ' . $token->tokenType . ' ' . $token->token
        ]);

        return $this->parseHotelsResponse($response);
    }

    private function listHotelsByGeocode(float $latitude, float $longitude, AccessTokenDTO $token, int $radius = 50): array
    {
        $url = $this->getBaseUrl() . '/v1/reference-data/locations/hotels/by-geocode';
        $params = [
            'latitude' => $latitude,
            'longitude' => $longitude,
            'radius' => $radius,
            'radiusUnit' => 'KM'
        ];

        $response = $this->makeRequest('GET', $url . '?' . http_build_query($params), null, [
            'Authorization: ' . $token->tokenType . ' ' . $token->token
        ]);

        return $this->parseHotelsResponse($response);
    }

    private function fetchOffersForHotels(array $hotelIds, array $searchParams, AccessTokenDTO $token): array
    {
        $url = $this->getBaseUrl() . '/v3/shopping/hotel-offers';
        $params = [
            'hotelIds' => implode(',', $hotelIds),
            'adults' => $searchParams['adults'] ?? 2,
            'roomQuantity' => $searchParams['rooms'] ?? 1,
            'checkInDate' => $searchParams['checkInDate']
        ];

        if (isset($searchParams['checkOutDate'])) {
            $params['checkOutDate'] = $searchParams['checkOutDate'];
        }

        $response = $this->makeRequest('GET', $url . '?' . http_build_query($params), null, [
            'Authorization: ' . $token->tokenType . ' ' . $token->token
        ]);

        return $this->parseOffersResponse($response);
    }

    private function fetchRatingsForHotels(array $hotelIds, AccessTokenDTO $token): array
    {
        $url = $this->getBaseUrl() . '/v2/e-reputation/hotel-sentiments';
        $params = [
            'hotelIds' => implode(',', $hotelIds)
        ];

        $response = $this->makeRequest('GET', $url . '?' . http_build_query($params), null, [
            'Authorization: ' . $token->tokenType . ' ' . $token->token
        ]);

        return $this->parseRatingsResponse($response);
    }

    private function parseHotelsResponse(array $response): array
    {
        if (!isset($response['data'])) {
            return [];
        }

        $hotels = [];
        foreach ($response['data'] as $hotel) {
            $hotels[] = new HotelDTO(
                externalId: $hotel['hotelId'],
                name: $hotel['name'],
                address: $hotel['address'] ?? [],
                geoCode: $hotel['geoCode'] ?? null,
                description: null // Amadeus hotel list doesn't provide descriptions
            );
        }

        return $hotels;
    }

    private function parseOffersResponse(array $response): array
    {
        if (!isset($response['data'])) {
            return [];
        }

        $offers = [];
        foreach ($response['data'] as $hotelData) {
            $hotelId = $hotelData['hotel']['hotelId'];
            
            if (!isset($hotelData['offers'])) {
                continue;
            }

            foreach ($hotelData['offers'] as $offer) {
                $room = new RoomDTO(
                    type: $offer['room']['type'] ?? 'UNKNOWN',
                    description: $offer['room']['description']['text'] ?? '',
                    capacity: null, // Will be derived in RoomDTO
                    typeEstimated: $offer['room']['typeEstimated'] ?? null
                );

                $offers[] = new OfferDTO(
                    hotelId: $hotelId,
                    offerId: $offer['id'],
                    price: (float) $offer['price']['total'],
                    currency: $offer['price']['currency'],
                    checkInDate: $offer['checkInDate'] ?? '',
                    checkOutDate: $offer['checkOutDate'] ?? '',
                    room: $room,
                    policies: $offer['policies'] ?? null,
                    cancellation: $offer['cancellation'] ?? null
                );
            }
        }

        return $offers;
    }

    private function parseRatingsResponse(array $response): array
    {
        if (!isset($response['data'])) {
            return [];
        }

        $ratings = [];
        foreach ($response['data'] as $rating) {
            $ratings[] = new RatingDTO(
                hotelId: $rating['hotelId'],
                overallRating: (float) ($rating['overallRating'] ?? 0),
                categoryRatings: $rating['sentiments'] ?? null,
                numberOfReviews: $rating['numberOfReviews'] ?? null
            );
        }

        return $ratings;
    }

    private function getBaseUrl(): string
    {
        return $this->isTest ? self::TEST_BASE_URL : self::PROD_BASE_URL;
    }

    private function makeRequest(string $method, string $url, ?array $data = null, array $headers = []): array
    {
        $ch = curl_init();
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
        ]);

        if ($data !== null) {
            if ($method === 'POST' && in_array('Content-Type: application/x-www-form-urlencoded', $headers)) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
            } else {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                $headers[] = 'Content-Type: application/json';
                curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            }
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("cURL error: $error");
        }

        if ($httpCode >= 400) {
            throw new Exception("HTTP error $httpCode: $response");
        }

        $decoded = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON response: " . json_last_error_msg());
        }

        return $decoded;
    }
}
