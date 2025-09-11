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
    public string $currency = 'EUR';
    public string $check_in_date = '';
    public string $check_out_date = '';
    public string $source = '';
    public string $external_id = '';
    public string $last_seen_at = '';
    public bool $is_active = true;

    public static array $indexes = [
        'price' => 'index',
        'source' => 'index',
        'external_id' => 'index',
        'check_in_date' => 'index',
        'is_active' => 'index',
        'last_seen_at' => 'index',
        ['source', 'external_id'] => 'unique'
    ];

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
