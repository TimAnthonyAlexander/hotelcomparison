<?php

namespace App\Import\DTOs;

class RoomDTO
{
    public function __construct(
        public readonly string $type,
        public readonly string $description,
        public readonly ?int $capacity = null,
        public readonly ?array $typeEstimated = null,
        public readonly ?array $amenities = null
    ) {}

    public function getTitle(): string
    {
        return !empty($this->description) ? $this->description : $this->type;
    }

    public function getCapacity(): int
    {
        if ($this->capacity !== null) {
            return $this->capacity;
        }
        
        // Try to derive from typeEstimated
        if (!empty($this->typeEstimated['beds'])) {
            return (int) $this->typeEstimated['beds'];
        }
        
        // Default fallback
        return 2;
    }

    public function getNormalizedType(): string
    {
        // Use typeEstimated.category if available, otherwise type
        return !empty($this->typeEstimated['category']) 
            ? $this->typeEstimated['category'] 
            : $this->type;
    }
}
