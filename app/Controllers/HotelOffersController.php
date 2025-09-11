<?php

namespace App\Controllers;

use App\Models\Hotel;
use App\Models\Room;
use App\Models\Offer;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class HotelOffersController extends Controller
{
    public string $hotel_id = '';
    public string $check_in_date = '';
    public string $check_out_date = '';
    public bool $active_only = true;

    public function get(): JsonResponse
    {
        if (empty($this->hotel_id)) {
            return JsonResponse::error('Hotel ID parameter is required', 400);
        }

        try {
            // Find the hotel
            $hotel = Hotel::find($this->hotel_id);
            if (!$hotel) {
                return JsonResponse::error('Hotel not found', 404);
            }

            // Get all rooms for this hotel
            $rooms = Room::where('hotel_id', '=', $this->hotel_id)->get();

            $roomsWithOffers = [];
            
            foreach ($rooms as $room) {
                // Build offers query for this room
                $offersQuery = Offer::where('room_id', '=', $room->id);
                
                // Filter by active status if requested
                if ($this->active_only) {
                    $offersQuery = $offersQuery->where('is_active', '=', true);
                }
                
                // Filter by check-in date if provided
                if (!empty($this->check_in_date)) {
                    $offersQuery = $offersQuery->where('check_in_date', '=', $this->check_in_date);
                }
                
                // Filter by check-out date if provided
                if (!empty($this->check_out_date)) {
                    $offersQuery = $offersQuery->where('check_out_date', '=', $this->check_out_date);
                }
                
                // Order offers by price ascending
                $offers = $offersQuery->orderBy('price', 'ASC')->get();
                
                $roomsWithOffers[] = [
                    'room' => $room->toArray(),
                    'offers' => array_map(fn($offer) => $offer->toArray(), $offers),
                    'offer_count' => count($offers),
                    'min_price' => !empty($offers) ? min(array_map(fn($offer) => $offer->price, $offers)) : null,
                    'max_price' => !empty($offers) ? max(array_map(fn($offer) => $offer->price, $offers)) : null
                ];
            }

            // Calculate summary statistics
            $totalOffers = array_sum(array_map(fn($room) => $room['offer_count'], $roomsWithOffers));
            $allPrices = [];
            foreach ($roomsWithOffers as $room) {
                foreach ($room['offers'] as $offer) {
                    $allPrices[] = $offer['price'];
                }
            }

            return JsonResponse::ok([
                'hotel' => $hotel->toArray(),
                'rooms' => $roomsWithOffers,
                'summary' => [
                    'total_rooms' => count($roomsWithOffers),
                    'total_offers' => $totalOffers,
                    'min_price' => !empty($allPrices) ? min($allPrices) : null,
                    'max_price' => !empty($allPrices) ? max($allPrices) : null,
                    'average_price' => !empty($allPrices) ? round(array_sum($allPrices) / count($allPrices), 2) : null
                ],
                'filters' => [
                    'check_in_date' => $this->check_in_date ?: null,
                    'check_out_date' => $this->check_out_date ?: null,
                    'active_only' => $this->active_only
                ]
            ]);
        } catch (\Exception $e) {
            return JsonResponse::error('Failed to fetch hotel offers: ' . $e->getMessage(), 500);
        }
    }
}
