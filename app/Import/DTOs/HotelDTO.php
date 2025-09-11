<?php

namespace App\Import\DTOs;

class HotelDTO
{
    public function __construct(
        public readonly string $externalId,
        public readonly string $name,
        public readonly array $address,
        public readonly ?array $geoCode = null,
        public readonly ?string $description = null,
        public readonly ?float $rating = null
    ) {}

    public function getFormattedAddress(): string
    {
        $parts = [];
        
        if (!empty($this->address['addressLine'])) {
            $parts[] = $this->address['addressLine'];
        }
        
        if (!empty($this->address['cityName'])) {
            $parts[] = $this->address['cityName'];
        }
        
        if (!empty($this->address['postalCode'])) {
            $parts[] = $this->address['postalCode'];
        }
        
        if (!empty($this->address['countryCode'])) {
            $parts[] = $this->address['countryCode'];
        }
        
        return implode(', ', array_filter($parts));
    }
}
