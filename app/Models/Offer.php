<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
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

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
