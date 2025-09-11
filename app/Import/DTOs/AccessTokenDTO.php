<?php

namespace App\Import\DTOs;

class AccessTokenDTO
{
    public function __construct(
        public readonly string $token,
        public readonly int $expiresIn,
        public readonly string $tokenType = 'Bearer'
    ) {}

    public function isExpired(): bool
    {
        // Add some buffer time (5 minutes)
        return time() >= ($this->expiresIn - 300);
    }
}
