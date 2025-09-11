<?php

/**
 * Hotel Import System Example
 * 
 * This example demonstrates how to use the hotel import system programmatically.
 * Make sure to set up your environment variables before running this script.
 */

require_once __DIR__ . '/../vendor/autoload.php';

use App\Import\Services\ImportOrchestrator;
use App\Import\Services\ProviderRegistry;
use App\Import\Services\ImportConfig;
use App\Import\Mappers\DefaultMapper;

try {
    echo "Hotel Import System Example\n";
    echo "===========================\n\n";

    // Initialize the import system
    echo "1. Initializing import system...\n";
    
    $registry = new ProviderRegistry(ImportConfig::getProviderConfigs());
    $mapper = new DefaultMapper();
    
    // Get the Amadeus provider
    $provider = $registry->getProvider('amadeus');
    
    // Create the orchestrator
    $orchestrator = new ImportOrchestrator(
        provider: $provider,
        mapper: $mapper,
        config: ImportConfig::getImportSettings()
    );

    echo "2. Running import for Berlin hotels...\n";
    
    // Define the scope (Berlin city)
    $scope = ['cityCode' => 'BER'];
    
    // Define search parameters
    $searchParams = [
        'checkInDate' => date('Y-m-d', strtotime('+14 days')),
        'checkOutDate' => date('Y-m-d', strtotime('+16 days')),
        'adults' => 2,
        'rooms' => 1
    ];
    
    echo "Scope: " . json_encode($scope) . "\n";
    echo "Search Parameters: " . json_encode($searchParams) . "\n\n";
    
    // Run the import
    $stats = $orchestrator->runImport($scope, $searchParams);
    
    // Display results
    echo "\n3. Import Results:\n";
    echo "==================\n";
    echo "Hotels - Processed: {$stats['hotels_processed']}, Created: {$stats['hotels_created']}, Updated: {$stats['hotels_updated']}\n";
    echo "Rooms - Processed: {$stats['rooms_processed']}, Created: {$stats['rooms_created']}, Updated: {$stats['rooms_updated']}\n";
    echo "Offers - Processed: {$stats['offers_processed']}, Created: {$stats['offers_created']}, Updated: {$stats['offers_updated']}, Deactivated: {$stats['offers_deactivated']}\n";

    if (!empty($stats['errors'])) {
        echo "\nErrors encountered:\n";
        foreach ($stats['errors'] as $error) {
            echo "- $error\n";
        }
    }

    echo "\nImport completed successfully!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Make sure you have:\n";
    echo "1. Set up your Amadeus API credentials in environment variables\n";
    echo "2. Run 'composer install' to install dependencies\n";
    echo "3. Applied database migrations for the new fields\n";
    exit(1);
}
