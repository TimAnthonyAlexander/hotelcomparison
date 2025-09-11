<?php

// Import Configuration
// This file provides default configurations for the hotel import system

return [
    'providers' => [
        'amadeus' => [
            'client_id' => $_ENV['AMADEUS_CLIENT_ID'] ?? '',
            'client_secret' => $_ENV['AMADEUS_CLIENT_SECRET'] ?? '',
            'is_test' => ($_ENV['AMADEUS_ENV'] ?? 'test') === 'test',
            'max_hotel_ids_per_call' => (int) ($_ENV['IMPORT_MAX_HOTELIDS_PER_CALL'] ?? 50)
        ]
    ],
    
    'settings' => [
        'cities' => explode(',', $_ENV['IMPORT_CITIES'] ?? 'BER,PAR,MUC,NYC,LON'),
        'checkin_days' => array_map('intval', explode(',', $_ENV['IMPORT_CHECKIN_DAYS'] ?? '14,30')),
        'import_ratings' => filter_var($_ENV['IMPORT_RATINGS'] ?? 'true', FILTER_VALIDATE_BOOLEAN),
        'delay_ms' => (int) ($_ENV['IMPORT_DELAY_MS'] ?? 100),
        'max_retries' => (int) ($_ENV['IMPORT_MAX_RETRIES'] ?? 3),
        'backoff_multiplier' => (int) ($_ENV['IMPORT_BACKOFF_MULTIPLIER'] ?? 2)
    ],
    
    'default_search_params' => [
        'adults' => 2,
        'rooms' => 1,
        'checkInDate' => date('Y-m-d', strtotime('+14 days')),
        'checkOutDate' => date('Y-m-d', strtotime('+16 days'))
    ]
];
