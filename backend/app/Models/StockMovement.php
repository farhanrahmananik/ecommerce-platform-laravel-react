<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    use HasFactory;

    public const TYPE_MANUAL_ADJUSTMENT = 'manual_adjustment';

    public const TYPE_ORDER_PLACED = 'order_placed';

    protected $fillable = ['product_id', 'type', 'quantity_before', 'quantity_changed', 'quantity_after', 'reason', 'reference_type', 'reference_id', 'created_by_id'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    protected function casts(): array
    {
        return ['quantity_before' => 'integer', 'quantity_changed' => 'integer', 'quantity_after' => 'integer'];
    }
}
