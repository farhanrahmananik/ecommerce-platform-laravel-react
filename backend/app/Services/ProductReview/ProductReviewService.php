<?php

namespace App\Services\ProductReview;

use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductReviewService
{
    private const PURCHASED_ORDER_STATUS = 'delivered';

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listApprovedForProduct(
        Product $product,
        array $filters = [],
    ): LengthAwarePaginator {
        $this->ensureProductIsVisible($product);
        $rating = filter_var(
            $filters['rating'] ?? null,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1, 'max_range' => 5]],
        );
        $perPage = min(max((int) ($filters['per_page'] ?? 10), 1), 50);

        return $product->reviews()
            ->approved()
            ->with('user')
            ->when(
                $rating !== false,
                fn (Builder $query): Builder => $query->where('rating', $rating),
            )
            ->orderByDesc('reviewed_at')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listForUser(
        User $user,
        array $filters = [],
    ): LengthAwarePaginator {
        $status = is_string($filters['status'] ?? null)
            ? trim($filters['status'])
            : '';
        $perPage = min(max((int) ($filters['per_page'] ?? 10), 1), 50);

        return $user->productReviews()
            ->with(['product.primaryImage'])
            ->when(
                in_array($status, ProductReview::statuses(), true),
                fn (Builder $query): Builder => $query->where('status', $status),
            )
            ->latest('reviewed_at')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createReview(
        User $user,
        Product $product,
        array $data,
    ): ProductReview {
        $this->ensureProductIsVisible($product);

        return DB::transaction(function () use ($data, $product, $user): ProductReview {
            User::query()
                ->whereKey($user->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if (ProductReview::query()
                ->where('user_id', $user->getKey())
                ->where('product_id', $product->getKey())
                ->exists()) {
                throw ValidationException::withMessages([
                    'product' => 'You have already reviewed this product.',
                ]);
            }

            $orderItem = $this->eligibleOrderItem($user, $product);

            if (! $orderItem) {
                throw ValidationException::withMessages([
                    'product' => 'Only customers with a delivered purchase can review this product.',
                ]);
            }

            return ProductReview::query()->create([
                ...$data,
                'product_id' => $product->getKey(),
                'user_id' => $user->getKey(),
                'order_item_id' => $orderItem->getKey(),
                'status' => ProductReview::STATUS_PENDING,
                'is_verified_purchase' => true,
                'reviewed_at' => now(),
                'approved_at' => null,
                'rejected_at' => null,
                'moderated_by_id' => null,
                'moderation_note' => null,
            ])->load(['user', 'product.primaryImage']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateReview(
        User $user,
        ProductReview $review,
        array $data,
    ): ProductReview {
        return DB::transaction(function () use ($data, $review, $user): ProductReview {
            $ownedReview = ProductReview::query()
                ->whereKey($review->getKey())
                ->where('user_id', $user->getKey())
                ->lockForUpdate()
                ->first();

            if (! $ownedReview) {
                $this->throwReviewNotFound($review);
            }

            $ownedReview->update([
                ...$data,
                'status' => ProductReview::STATUS_PENDING,
                'reviewed_at' => now(),
                'approved_at' => null,
                'rejected_at' => null,
                'moderated_by_id' => null,
                'moderation_note' => null,
            ]);

            return $ownedReview->load(['user', 'product.primaryImage']);
        });
    }

    public function deleteReview(User $user, ProductReview $review): void
    {
        DB::transaction(function () use ($review, $user): void {
            $ownedReview = ProductReview::query()
                ->whereKey($review->getKey())
                ->where('user_id', $user->getKey())
                ->lockForUpdate()
                ->first();

            if (! $ownedReview) {
                $this->throwReviewNotFound($review);
            }

            $ownedReview->delete();
        });
    }

    /**
     * @return array{average_rating: float, review_count: int, rating_breakdown: list<array{rating: int, count: int}>}
     */
    public function ratingSummary(Product $product): array
    {
        $counts = $product->reviews()
            ->approved()
            ->selectRaw('rating, COUNT(*) as aggregate')
            ->groupBy('rating')
            ->pluck('aggregate', 'rating');
        $breakdown = [];
        $reviewCount = 0;
        $weightedTotal = 0;

        foreach (range(5, 1) as $rating) {
            $count = (int) ($counts[$rating] ?? 0);

            $breakdown[] = [
                'rating' => $rating,
                'count' => $count,
            ];
            $reviewCount += $count;
            $weightedTotal += $count * $rating;
        }

        return [
            'average_rating' => $reviewCount > 0
                ? round($weightedTotal / $reviewCount, 2)
                : 0.0,
            'review_count' => $reviewCount,
            'rating_breakdown' => $breakdown,
        ];
    }

    private function eligibleOrderItem(
        User $user,
        Product $product,
    ): ?OrderItem {
        return OrderItem::query()
            ->where('product_id', $product->getKey())
            ->whereHas('order', function (Builder $query) use ($user): void {
                $query
                    ->where('user_id', $user->getKey())
                    ->where('status', self::PURCHASED_ORDER_STATUS);
            })
            ->latest('id')
            ->first();
    }

    private function ensureProductIsVisible(Product $product): void
    {
        abort_unless($product->is_active, 404);
    }

    private function throwReviewNotFound(ProductReview $review): never
    {
        throw (new ModelNotFoundException)->setModel(
            ProductReview::class,
            [$review->getKey()],
        );
    }
}
