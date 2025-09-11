<?php

namespace App\Models;

use BaseApi\Models\BaseModel;

/**
 * Room Model
 */
class Room extends BaseModel
{
    public string $title = '';
    public string $type = '';
    public int $capacity = 1;
    public Hotel $hotel;

    public static array $indexes = [
        'title' => 'index',
        'type' => 'index'
    ];

    public function hotel(): \BaseApi\Database\Relations\BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function bookings(): \BaseApi\Database\Relations\HasMany
    {
        return $this->hasMany(Offer::class);
    }
}
