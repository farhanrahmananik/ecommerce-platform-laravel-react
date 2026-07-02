<?php

namespace App\Services\Storefront;

use App\Models\Product;
use App\Services\ProductReview\ProductReviewService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class StorefrontProductService
{
    public function __construct(
        private readonly ProductReviewService $productReviewService,
    ) {}

    private const EFFECTIVE_PRICE_SQL = <<<'SQL'
        CASE
            WHEN sale_price IS NOT NULL AND sale_price < price THEN sale_price
            ELSE price
        END
        SQL;

    /**
     * Get a filtered page of customer-visible products.
     *
     * @param  array<string, mixed>  $filters
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = Product::query()
            ->active()
            ->with(['category', 'primaryImage']);

        $this->applySearchFilter($query, $filters['search'] ?? null);
        $this->applyCategoryFilter($query, $filters['category'] ?? null);
        $this->applyFeaturedFilter($query, $filters['featured'] ?? null);
        $this->applySorting($query, $filters['sort'] ?? 'latest');

        return $query
            ->paginate((int) ($filters['per_page'] ?? 12))
            ->withQueryString();
    }

    /**
     * Find a customer-visible product by its public slug.
     */
    public function findVisibleBySlug(string $slug): Product
    {
        $product = Product::query()
            ->active()
            ->where('slug', $slug)
            ->with(['category', 'primaryImage', 'images'])
            ->firstOrFail();

        $product->setAttribute(
            'rating_summary',
            $this->productReviewService->ratingSummary($product),
        );

        return $product;
    }

    private function applySearchFilter(Builder $query, mixed $search): void
    {
        if (! is_string($search) || blank($search)) {
            return;
        }

        $searchTerm = '%'.addcslashes(trim($search), '\\%_').'%';

        $query->where(function (Builder $query) use ($searchTerm): void {
            $query
                ->where('name', 'like', $searchTerm)
                ->orWhere('slug', 'like', $searchTerm)
                ->orWhere('short_description', 'like', $searchTerm)
                ->orWhere('description', 'like', $searchTerm);
        });
    }

    private function applyCategoryFilter(Builder $query, mixed $category): void
    {
        if (! is_string($category) || blank($category)) {
            return;
        }

        $query->whereHas('category', function (Builder $query) use ($category): void {
            $query->where('slug', $category);
        });
    }

    private function applyFeaturedFilter(Builder $query, mixed $featured): void
    {
        if ($featured === null || $featured === '') {
            return;
        }

        $query->where(
            'is_featured',
            filter_var($featured, FILTER_VALIDATE_BOOL),
        );
    }

    private function applySorting(Builder $query, mixed $sort): void
    {
        match ($sort) {
            'price_asc' => $query
                ->orderByRaw(self::EFFECTIVE_PRICE_SQL.' ASC')
                ->orderBy('id'),
            'price_desc' => $query
                ->orderByRaw(self::EFFECTIVE_PRICE_SQL.' DESC')
                ->orderBy('id'),
            'name_asc' => $query
                ->orderBy('name')
                ->orderBy('id'),
            default => $query
                ->orderByDesc('created_at')
                ->orderByDesc('id'),
        };
    }
}
