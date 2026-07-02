<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductReview extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_APPROVED = 'approved';

    public const STATUS_PENDING = 'pending';

    public const STATUS_REJECTED = 'rejected';

    /**
     * @return list<string>
     */
    public static function statuses(): array
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_APPROVED,
            self::STATUS_REJECTED,
        ];
    }

    /** @var list<string> */
    protected $fillable = [
        'product_id',
        'user_id',
        'order_item_id',
        'rating',
        'title',
        'comment',
        'status',
        'is_verified_purchase',
        'reviewed_at',
        'approved_at',
        'rejected_at',
        'moderated_by_id',
        'moderation_note',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function moderator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'moderated_by_id');
    }

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeRejected(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_REJECTED);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'is_verified_purchase' => 'boolean',
            'reviewed_at' => 'datetime',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }
}
