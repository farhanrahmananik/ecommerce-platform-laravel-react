<?php

namespace App\Services\Admin;

use App\Models\ProductReview;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class AdminProductReviewService
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $status = is_string($filters['status'] ?? null)
            ? trim($filters['status'])
            : '';
        $rating = filter_var(
            $filters['rating'] ?? null,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1, 'max_range' => 5]],
        );
        $search = is_string($filters['search'] ?? null)
            ? trim($filters['search'])
            : '';
        $productId = filter_var(
            $filters['product_id'] ?? null,
            FILTER_VALIDATE_INT,
        );
        $perPage = min(max((int) ($filters['per_page'] ?? 15), 1), 50);

        return ProductReview::query()
            ->with(['user', 'product.primaryImage', 'moderator'])
            ->when(
                in_array($status, ProductReview::statuses(), true),
                fn (Builder $query): Builder => $query->where('status', $status),
            )
            ->when(
                $rating !== false,
                fn (Builder $query): Builder => $query->where('rating', $rating),
            )
            ->when(
                $productId !== false,
                fn (Builder $query): Builder => $query->where('product_id', $productId),
            )
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('comment', 'like', "%{$search}%")
                        ->orWhereHas('user', fn (Builder $query): Builder => $query
                            ->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('product', fn (Builder $query): Builder => $query
                            ->where('name', 'like', "%{$search}%"));
                });
            })
            ->latest('reviewed_at')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function show(ProductReview $review): ProductReview
    {
        return $review->load([
            'user',
            'product.primaryImage',
            'orderItem.order',
            'moderator',
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function moderate(
        ProductReview $review,
        array $data,
        User $moderator,
    ): ProductReview {
        return DB::transaction(function () use ($data, $moderator, $review): ProductReview {
            $lockedReview = ProductReview::query()
                ->whereKey($review->getKey())
                ->lockForUpdate()
                ->firstOrFail();
            $isApproved = $data['status'] === ProductReview::STATUS_APPROVED;

            $lockedReview->update([
                'status' => $data['status'],
                'approved_at' => $isApproved ? now() : null,
                'rejected_at' => $isApproved ? null : now(),
                'moderated_by_id' => $moderator->getKey(),
                'moderation_note' => $data['moderation_note'] ?? null,
            ]);

            return $this->show($lockedReview);
        });
    }
}
