<?php

namespace App\Models;

use BaseApi\Database\Relations\HasMany;
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

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }
}
