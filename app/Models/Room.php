<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Database\Relations\HasMany;
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
    public string $source = '';
    public string $external_id = '';

    public static array $indexes = [
        'title' => 'index',
        'type' => 'index',
        'source' => 'index',
        'external_id' => 'index',
        ['source', 'external_id'] => 'unique'
    ];

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function offers(): HasMany
    {
        return $this->hasMany(Offer::class);
    }
}
