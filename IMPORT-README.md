# Hotel Import System

A comprehensive, provider-agnostic hotel import system designed to fetch hotels, rooms, and offers from various external APIs and import them into your application.

## Architecture Overview

The import system follows a modular architecture with the following components:

- **Provider Adapters**: Handle API communication with external providers (Amadeus, HotelBeds, etc.)
- **DTOs (Data Transfer Objects)**: Standardize data structure across providers
- **Mappers**: Convert provider DTOs to your application models
- **Orchestrator**: Manages the complete import workflow
- **Commands**: Command-line interface for running imports

## Setup

### 1. Environment Configuration

Create a `.env` file in your project root with the following variables:

```bash
# Amadeus API Configuration
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
AMADEUS_ENV=test  # or 'prod' for production

# Import Configuration
IMPORT_CITIES=BER,PAR,MUC,NYC,LON
IMPORT_CHECKIN_DAYS=14,30
IMPORT_MAX_HOTELIDS_PER_CALL=50
IMPORT_RATINGS=true

# Rate Limiting
IMPORT_DELAY_MS=100
IMPORT_MAX_RETRIES=3
IMPORT_BACKOFF_MULTIPLIER=2
```

### 2. Database Migration

The system has added new fields to your existing models. Run database migrations to add these fields:

- `Hotel`: `source`, `external_id`
- `Room`: `source`, `external_id`
- `Offer`: `currency`, `check_in_date`, `check_out_date`, `source`, `external_id`, `last_seen_at`, `is_active`

## Usage

### Command Line Interface

Use the import console to run hotel imports:

```bash
# Basic import by city
./bin/import-console import:hotels --city=BER

# Import by coordinates
./bin/import-console import:hotels --lat=52.5200 --lng=13.4050 --radius=25

# Import with specific dates
./bin/import-console import:hotels --city=PAR --checkin=2025-10-15 --checkout=2025-10-17

# Import with custom parameters
./bin/import-console import:hotels --city=MUC --adults=4 --rooms=2
```

### Available Options

- `--provider=PROVIDER`: Provider to use (default: amadeus)
- `--city=CITY`: City code (e.g., BER, PAR, MUC)
- `--lat=LAT --lng=LNG`: Latitude and longitude coordinates
- `--radius=RADIUS`: Search radius in KM (default: 50)
- `--hotel-ids=IDS`: Comma-separated list of hotel IDs
- `--checkin=DATE`: Check-in date (YYYY-MM-DD)
- `--checkout=DATE`: Check-out date (YYYY-MM-DD)
- `--adults=NUM`: Number of adults (default: 2)
- `--rooms=NUM`: Number of rooms (default: 1)

### Programmatic Usage

```php
use App\Import\Services\ImportOrchestrator;
use App\Import\Services\ProviderRegistry;
use App\Import\Services\ImportConfig;
use App\Import\Mappers\DefaultMapper;

// Initialize services
$registry = new ProviderRegistry(ImportConfig::getProviderConfigs());
$mapper = new DefaultMapper();

$provider = $registry->getProvider('amadeus');
$orchestrator = new ImportOrchestrator(
    provider: $provider,
    mapper: $mapper,
    config: ImportConfig::getImportSettings()
);

// Run import
$scope = ['cityCode' => 'BER'];
$searchParams = [
    'checkInDate' => '2025-10-15',
    'checkOutDate' => '2025-10-17',
    'adults' => 2,
    'rooms' => 1
];

$stats = $orchestrator->runImport($scope, $searchParams);
```

## Import Workflow

The system follows a structured import process:

### Phase A: Hotel Catalog Import
1. Authenticate with the provider
2. Fetch hotels by city/coordinates/IDs
3. Map hotel DTOs to your Hotel models
4. Upsert hotels (create new or update existing)

### Phase B: Ratings Import (Optional)
1. Fetch ratings for imported hotels
2. Update hotel ratings

### Phase C: Offers and Rooms Import
1. Fetch offers for imported hotels
2. Map offer DTOs to Room and Offer models
3. Upsert rooms and offers
4. Track seen offers for reconciliation

### Phase D: Reconciliation
1. Mark offers not seen in current run as inactive
2. Maintain data integrity

## Provider Support

### Amadeus (Implemented)
- **Authentication**: OAuth2 Client Credentials
- **Hotel List**: By city code or geocoordinates
- **Hotel Search**: Batch hotel offers with rooms and pricing
- **Ratings**: Hotel sentiment analysis (optional)
- **Rate Limits**: Built-in backoff and retry logic

### Future Providers
The architecture supports easy addition of new providers:
- HotelBeds
- Expedia Partner Solutions
- RateHawk
- TBO
- Sabre

## Data Mapping

### Hotel Mapping
- `title` ← provider hotel name (normalized)
- `address` ← formatted address string
- `rating` ← overall rating (from ratings API if available)
- `description` ← hotel description (if available)
- `source` ← provider name (e.g., 'amadeus')
- `external_id` ← provider hotel ID

### Room Mapping
- `title` ← room description or type
- `type` ← normalized room type
- `capacity` ← derived from room metadata or search params
- `source` ← provider name
- `external_id` ← stable room identifier

### Offer Mapping
- `price` ← offer total price
- `currency` ← price currency
- `check_in_date` ← check-in date
- `check_out_date` ← check-out date
- `source` ← provider name
- `external_id` ← provider offer ID
- `last_seen_at` ← timestamp of last import
- `is_active` ← active status (for reconciliation)

## Error Handling

The system includes comprehensive error handling:

- **API Errors**: HTTP errors, authentication failures, rate limits
- **Data Validation**: Invalid prices, missing required fields
- **Reconciliation**: Graceful handling of stale data
- **Logging**: Detailed error reporting and statistics

## Scheduling

For production use, consider scheduling regular imports:

```bash
# Daily hotel catalog refresh (cron example)
0 2 * * * /path/to/your/app/bin/import-console import:hotels --city=BER

# Hourly offer updates for popular cities
0 * * * * /path/to/your/app/bin/import-console import:hotels --city=PAR --city=LON
```

## Performance Considerations

- **Batching**: Hotel IDs are processed in configurable batches
- **Rate Limiting**: Built-in delays and exponential backoff
- **Caching**: Access tokens are cached until expiry
- **Reconciliation**: Efficient stale data cleanup

## Extending the System

### Adding a New Provider

1. Create a provider class implementing `ProviderInterface`
2. Register the provider in `ProviderRegistry`
3. Add configuration in `ImportConfig`
4. Test with the command-line interface

### Custom Mapping

Create a custom mapper implementing `MapperInterface` to customize how DTOs are converted to your models.

### Additional Commands

Add new import commands by implementing the `Command` interface and registering them in the console application.

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Check API credentials and environment settings
2. **Rate Limit Errors**: Increase delays or reduce batch sizes
3. **Data Validation Errors**: Check required fields and data formats
4. **Database Errors**: Ensure migrations are applied and constraints are met

### Debug Mode

Set `AMADEUS_ENV=test` to use the Amadeus test environment with sample data.

### Logging

The system provides detailed statistics and error reporting for each import run.

## API Documentation

### Amadeus API Endpoints Used

- **Authentication**: `POST /v1/security/oauth2/token`
- **Hotel List by City**: `GET /v1/reference-data/locations/hotels/by-city`
- **Hotel List by Geocode**: `GET /v1/reference-data/locations/hotels/by-geocode`
- **Hotel Offers**: `GET /v3/shopping/hotel-offers`
- **Hotel Ratings**: `GET /v2/e-reputation/hotel-sentiments`

For detailed API documentation, visit: https://developers.amadeus.com/

## Support

For issues or questions about the import system, please refer to the code documentation or create an issue in your project repository.
