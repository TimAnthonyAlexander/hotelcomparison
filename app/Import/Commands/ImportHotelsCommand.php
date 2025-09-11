<?php

namespace App\Import\Commands;

use App\Import\Services\ImportOrchestrator;
use App\Import\Services\ProviderRegistry;
use App\Import\Services\ImportConfig;
use App\Import\Mappers\DefaultMapper;

class ImportHotelsCommand
{
    public function run(array $args = []): void
    {
        echo "Hotel Import System\n";
        echo "==================\n\n";

        try {
            // Parse command line arguments
            $provider = $args['provider'] ?? 'amadeus';
            $scope = $this->parseScope($args);
            $searchParams = $this->parseSearchParams($args);
            
            echo "Provider: $provider\n";
            echo "Scope: " . json_encode($scope) . "\n";
            echo "Search Parameters: " . json_encode($searchParams) . "\n\n";

            // Initialize services
            $registry = new ProviderRegistry(ImportConfig::getProviderConfigs());
            $mapper = new DefaultMapper();
            
            $providerInstance = $registry->getProvider($provider);
            $orchestrator = new ImportOrchestrator(
                provider: $providerInstance,
                mapper: $mapper,
                config: ImportConfig::getImportSettings()
            );

            // Run the import
            $stats = $orchestrator->runImport($scope, $searchParams);

            // Display results
            $this->displayStats($stats);

        } catch (\Exception $e) {
            echo "Error: " . $e->getMessage() . "\n";
            exit(1);
        }
    }

    private function parseScope(array $args): array
    {
        if (isset($args['city'])) {
            return ['cityCode' => strtoupper($args['city'])];
        }
        
        if (isset($args['lat']) && isset($args['lng'])) {
            return [
                'latitude' => (float) $args['lat'],
                'longitude' => (float) $args['lng'],
                'radius' => (int) ($args['radius'] ?? 50)
            ];
        }
        
        if (isset($args['hotel-ids'])) {
            return ['hotelIds' => explode(',', $args['hotel-ids'])];
        }
        
        // Default to first configured city
        $cities = ImportConfig::getCityScopes();
        return $cities[0] ?? ['cityCode' => 'BER'];
    }

    private function parseSearchParams(array $args): array
    {
        $defaults = ImportConfig::getDefaultSearchParams();
        
        return [
            'checkInDate' => $args['checkin'] ?? $defaults['checkInDate'],
            'checkOutDate' => $args['checkout'] ?? $defaults['checkOutDate'],
            'adults' => (int) ($args['adults'] ?? $defaults['adults']),
            'rooms' => (int) ($args['rooms'] ?? $defaults['rooms'])
        ];
    }

    private function displayStats(array $stats): void
    {
        echo "\nImport Results:\n";
        echo "===============\n";
        echo "Hotels - Processed: {$stats['hotels_processed']}, Created: {$stats['hotels_created']}, Updated: {$stats['hotels_updated']}\n";
        echo "Rooms - Processed: {$stats['rooms_processed']}, Created: {$stats['rooms_created']}, Updated: {$stats['rooms_updated']}\n";
        echo "Offers - Processed: {$stats['offers_processed']}, Created: {$stats['offers_created']}, Updated: {$stats['offers_updated']}, Deactivated: {$stats['offers_deactivated']}\n";

        if (!empty($stats['errors'])) {
            echo "\nErrors:\n";
            foreach ($stats['errors'] as $error) {
                echo "- $error\n";
            }
        }

        echo "\nImport completed successfully!\n";
    }

    public function help(): void
    {
        echo "Hotel Import Command\n";
        echo "===================\n\n";
        echo "Usage:\n";
        echo "  php bin/console import:hotels [options]\n\n";
        echo "Options:\n";
        echo "  --provider=PROVIDER    Provider to use (default: amadeus)\n";
        echo "  --city=CITY           City code (e.g., BER, PAR, MUC)\n";
        echo "  --lat=LAT --lng=LNG   Latitude and longitude coordinates\n";
        echo "  --radius=RADIUS       Search radius in KM (default: 50)\n";
        echo "  --hotel-ids=IDS       Comma-separated list of hotel IDs\n";
        echo "  --checkin=DATE        Check-in date (YYYY-MM-DD)\n";
        echo "  --checkout=DATE       Check-out date (YYYY-MM-DD)\n";
        echo "  --adults=NUM          Number of adults (default: 2)\n";
        echo "  --rooms=NUM           Number of rooms (default: 1)\n\n";
        echo "Examples:\n";
        echo "  php bin/console import:hotels --city=BER\n";
        echo "  php bin/console import:hotels --lat=52.5200 --lng=13.4050 --radius=25\n";
        echo "  php bin/console import:hotels --city=PAR --checkin=2025-10-15 --checkout=2025-10-17\n";
    }
}
