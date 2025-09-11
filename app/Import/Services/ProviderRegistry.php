<?php

namespace App\Import\Services;

use App\Import\Contracts\ProviderInterface;
use App\Import\Providers\AmadeusProvider;
use Exception;

class ProviderRegistry
{
    private array $providers = [];
    private array $configs = [];

    public function __construct(array $configs = [])
    {
        $this->configs = $configs;
        $this->registerDefaultProviders();
    }

    public function registerProvider(string $name, ProviderInterface $provider): void
    {
        $this->providers[$name] = $provider;
    }

    public function getProvider(string $name): ProviderInterface
    {
        if (!isset($this->providers[$name])) {
            throw new Exception("Provider '$name' is not registered");
        }

        return $this->providers[$name];
    }

    public function getAvailableProviders(): array
    {
        return array_keys($this->providers);
    }

    private function registerDefaultProviders(): void
    {
        // Register Amadeus provider if configured
        if (isset($this->configs['amadeus'])) {
            $config = $this->configs['amadeus'];
            $provider = new AmadeusProvider(
                clientId: $config['client_id'],
                clientSecret: $config['client_secret'],
                isTest: $config['is_test'] ?? true,
                maxHotelIdsPerCall: $config['max_hotel_ids_per_call'] ?? 50
            );
            $this->registerProvider('amadeus', $provider);
        }

        // Future providers can be registered here
        // if (isset($this->configs['hotelbeds'])) {
        //     $this->registerProvider('hotelbeds', new HotelbedsProvider(...));
        // }
    }
}
