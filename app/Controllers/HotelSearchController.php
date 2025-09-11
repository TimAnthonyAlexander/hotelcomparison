<?php

namespace App\Controllers;

use App\Models\Hotel;
use App\Models\Room;
use App\Models\Offer;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class HotelSearchController extends Controller
{
    public string $location = '';
    public string $check_in_date = '';
    public string $check_out_date = '';
    public int $page = 1;
    public int $per_page = 20;
    public string $sort = 'price';
    public string $order = 'asc';

    public function get(): JsonResponse
    {
        if (empty($this->location)) {
            return JsonResponse::error('Location parameter is required', 400);
        }

        if (empty($this->check_in_date) || empty($this->check_out_date)) {
            return JsonResponse::error('Check-in and check-out dates are required', 400);
        }

        try {
            // Find hotels with available offers for the specified dates
            $hotelsWithOffers = $this->findHotelsWithAvailableOffers();

            // Apply sorting
            $hotelsWithOffers = $this->sortHotels($hotelsWithOffers);

            // Apply pagination
            $perPage = min(max($this->per_page, 1), 100);
            $totalCount = count($hotelsWithOffers);
            $totalPages = ceil($totalCount / $perPage);
            $offset = ($this->page - 1) * $perPage;
            
            $paginatedHotels = array_slice($hotelsWithOffers, $offset, $perPage);

            return JsonResponse::ok([
                'hotels' => $paginatedHotels,
                'pagination' => [
                    'current_page' => $this->page,
                    'per_page' => $perPage,
                    'total_count' => $totalCount,
                    'total_pages' => $totalPages,
                    'has_next_page' => $this->page < $totalPages,
                    'has_previous_page' => $this->page > 1
                ],
                'search' => [
                    'location' => $this->location,
                    'check_in_date' => $this->check_in_date,
                    'check_out_date' => $this->check_out_date,
                    'sort' => $this->sort,
                    'order' => $this->order
                ]
            ]);
        } catch (\Exception $e) {
            return JsonResponse::error('Search failed: ' . $e->getMessage(), 500);
        }
    }

    private function findHotelsWithAvailableOffers(): array
    {
        // Get all hotels in the location
        $hotelRows = Hotel::where('address', 'LIKE', '%' . $this->location . '%')->get();
        $hotels = array_map([Hotel::class, 'fromRow'], $hotelRows);

        $hotelsWithOffers = [];

        foreach ($hotels as $hotel) {
            // Get rooms for this hotel
            $roomRows = Room::where('hotel_id', '=', $hotel->id)->get();
            $rooms = array_map([Room::class, 'fromRow'], $roomRows);

            $bestPrice = null;
            $totalOffers = 0;
            $availableRooms = 0;

            foreach ($rooms as $room) {
                // Find offers for this room matching the dates
                $offerRows = Offer::where('room_id', '=', $room->id)
                    ->where('check_in_date', '=', $this->check_in_date)
                    ->where('check_out_date', '=', $this->check_out_date)
                    ->where('is_active', '=', true)
                    ->get();

                $offers = array_map([Offer::class, 'fromRow'], $offerRows);

                if (!empty($offers)) {
                    $availableRooms++;
                    $totalOffers += count($offers);
                    
                    // Find the best (lowest) price for this room
                    $roomBestPrice = min(array_map(fn($offer) => $offer->price, $offers));
                    
                    if ($bestPrice === null || $roomBestPrice < $bestPrice) {
                        $bestPrice = $roomBestPrice;
                    }
                }
            }

            // Only include hotels that have available offers
            if ($bestPrice !== null && $availableRooms > 0) {
                $hotelData = $hotel->toArray();
                $hotelData['best_price'] = $bestPrice;
                $hotelData['total_offers'] = $totalOffers;
                $hotelData['available_rooms'] = $availableRooms;
                $hotelData['currency'] = 'EUR'; // Default currency
                
                $hotelsWithOffers[] = $hotelData;
            }
        }

        return $hotelsWithOffers;
    }

    private function sortHotels(array $hotels): array
    {
        $sortField = $this->sort;
        $sortOrder = strtolower($this->order);

        usort($hotels, function($a, $b) use ($sortField, $sortOrder) {
            $valueA = $a[$sortField] ?? 0;
            $valueB = $b[$sortField] ?? 0;

            if ($valueA == $valueB) {
                return 0;
            }

            $result = $valueA < $valueB ? -1 : 1;
            
            return $sortOrder === 'desc' ? -$result : $result;
        });

        return $hotels;
    }
}
