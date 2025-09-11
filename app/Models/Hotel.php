<?php

namespace App\Models;

use BaseApi\Models\BaseModel;

/**
 * Hotel Model
 */
class Hotel extends BaseModel
{
    public string $title = '';
    public string $address = '';
    public float $rating = 0.0;
    public string $description = '';

    public static array $indexes = [
        'title' => 'index',
        'rating' => 'index'
    ];

    public function rooms(): \BaseApi\Database\Relations\HasMany
    {
        return $this->hasMany(Room::class);
    }
}
