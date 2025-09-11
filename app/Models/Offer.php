<?php

namespace App\Models;

use BaseApi\Models\BaseModel;

/**
 * Offer Model
 */
class Offer extends BaseModel
{
    // Add your model properties here
    // Example:
    // public string $name = '';
    // public ?string $email = null;
    // public bool $active = true;
    public float $price = 0.0;
    public string $room_id = '';

    // Optional: Define custom table name
    // protected static ?string $table = 'Offer_table';

    // Optional: Define indexes (used by migrations)
    // public static array $indexes = [
    //     'email' => 'unique',        // Creates unique index
    //     'created_at' => 'index',    // Creates regular index
    //     'status' => 'index'
    // ];
    public static array $indexes = [
        'price' => 'index'
    ];

    // Optional: Define column overrides (used by migrations)
    // public static array $columns = [
    //     'name' => ['type' => 'VARCHAR(120)', 'null' => false],
    //     'description' => ['type' => 'TEXT', 'null' => true],
    //     'price' => ['type' => 'DECIMAL(10,2)', 'default' => '0.00']
    // ];

    // Relations Examples:

    // belongsTo (many-to-one) - this model belongs to another
    // Example: Post belongs to User
    // public ?User $user = null;  // Add this property for the relation
    // 
    // public function user(): BelongsTo
    // {
    //     return $this->belongsTo(User::class);
    // }
    public function room(): \BaseApi\Database\Relations\BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    // hasMany (one-to-many) - this model has many of another
    // Example: User has many Posts
    // /** @var Post[] */
    // public array $posts = [];  // Add this property for the relation
    //
    // public function posts(): HasMany  
    // {
    //     return $this->hasMany(Post::class);
    // }

    // Usage examples:
    // $model = Offer::find('some-id');
    // $relatedModel = $model->user()->get();  // Get related model
    // $relatedModels = $model->posts()->get(); // Get array of related models
    // 
    // Eager loading:
    // $modelsWithRelations = Offer::with(['user', 'posts'])->get();
}

