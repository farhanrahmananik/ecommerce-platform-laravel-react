<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'sku',
        'short_description',
        'description',
        'price',
        'sale_price',
        'cost_price',
        'stock_quantity',
        'low_stock_threshold',
        'is_active',
        'is_featured',
        'sort_order',
        'meta_title',
        'meta_description',
    ];

    /**
     * Get the product category.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the product images in their display order.
     */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    /**
     * Get the product's primary image deterministically.
     */
    public function primaryImage(): HasOne
    {
        return $this->hasOne(ProductImage::class)
            ->where('is_primary', true)
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class);
    }

    public function productReviews(): HasMany
    {
        return $this->reviews();
    }

    /**
     * Scope the query to active products.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope the query to featured products.
     */
    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'stock_quantity' => 'integer',
            'low_stock_threshold' => 'integer',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
