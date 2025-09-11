<?php

namespace App\Models;

use BaseApi\Models\BaseModel;

/**
 * Offer Model
 */
class Offer extends BaseModel
{
    public float $price = 0.0;
    public Room $room;

    public static array $indexes = [
        'price' => 'index'
    ];

    public function room(): \BaseApi\Database\Relations\BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
