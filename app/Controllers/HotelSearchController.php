<?php

namespace App\Controllers;

use App\Models\Hotel;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class HotelSearchController extends Controller
{
    public string $location = '';
    public int $page = 1;
    public int $per_page = 20;
    public string $sort = 'rating';
    public string $order = 'desc';

    public function get(): JsonResponse
    {
        if (empty($this->location)) {
            return JsonResponse::error('Location parameter is required', 400);
        }

        try {
            // Search hotels by location (address contains the location)
            $query = Hotel::where('address', 'LIKE', '%' . $this->location . '%');

            // Apply sorting
            if (in_array($this->sort, ['title', 'rating', 'created_at'])) {
                $order = strtolower($this->order) === 'asc' ? 'ASC' : 'DESC';
                $query = $query->orderBy($this->sort, $order);
            } else {
                // Default sorting by rating descending
                $query = $query->orderBy('rating', 'DESC');
            }

            // Apply pagination
            $perPage = min(max($this->per_page, 1), 100); // Limit between 1 and 100
            $offset = ($this->page - 1) * $perPage;
            
            $rows = $query->limit($perPage)->offset($offset)->get();
            $hotels = array_map([Hotel::class, 'fromRow'], $rows);

            // Get total count for pagination info
            $totalCount = Hotel::where('address', 'LIKE', '%' . $this->location . '%')->count();
            
            $totalPages = ceil($totalCount / $perPage);

            return JsonResponse::ok([
                'hotels' => array_map(fn($hotel) => $hotel->toArray(), $hotels),
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
                    'sort' => $this->sort,
                    'order' => $this->order
                ]
            ]);
        } catch (\Exception $e) {
            return JsonResponse::error('Search failed: ' . $e->getMessage(), 500);
        }
    }
}
