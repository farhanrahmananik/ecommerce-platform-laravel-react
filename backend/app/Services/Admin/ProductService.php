<?php

namespace App\Services\Admin;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class ProductService
{
    /**
     * Get a filtered, ordered product page.
     *
     * @param  array<string, mixed>  $filters
     */
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        $query = Product::query()->with('category');

        $this->applySearchFilter($query, $filters['search'] ?? null);
        $this->applyCategoryFilter($query, $filters);
        $this->applyBooleanFilter($query, 'is_active', $filters['is_active'] ?? null);
        $this->applyBooleanFilter($query, 'is_featured', $filters['is_featured'] ?? null);
        $this->applyPriceFilter($query, '>=', $filters['min_price'] ?? null);
        $this->applyPriceFilter($query, '<=', $filters['max_price'] ?? null);

        $perPage = max(1, min(50, (int) ($filters['per_page'] ?? 15)));

        return $query
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Create a product.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Product
    {
        $data['slug'] = filled($data['slug'] ?? null)
            ? $data['slug']
            : $this->generateUniqueSlug($data['name']);

        $this->applyNumericDefaults($data);

        return Product::create($data)->load('category');
    }

    /**
     * Update a product.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Product $product, array $data): Product
    {
        if (array_key_exists('name', $data) && ! filled($data['slug'] ?? null)) {
            $data['slug'] = $this->generateUniqueSlug($data['name'], $product);
        } elseif (array_key_exists('slug', $data) && ! filled($data['slug'])) {
            unset($data['slug']);
        }

        $this->applyNumericDefaults($data, false);

        $product->update($data);

        return $product->refresh()->load('category');
    }

    /**
     * Soft delete a product.
     */
    public function delete(Product $product): void
    {
        $product->delete();
    }

    private function applySearchFilter(Builder $query, mixed $search): void
    {
        if (! is_string($search) || blank($search)) {
            return;
        }

        $query->where(function (Builder $query) use ($search): void {
            $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%");
        });
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function applyCategoryFilter(Builder $query, array $filters): void
    {
        if (! array_key_exists('category_id', $filters) || $filters['category_id'] === '') {
            return;
        }

        if ($filters['category_id'] === null || $filters['category_id'] === 'null') {
            $query->whereNull('category_id');

            return;
        }

        if (is_numeric($filters['category_id'])) {
            $query->where('category_id', (int) $filters['category_id']);
        }
    }

    private function applyBooleanFilter(Builder $query, string $column, mixed $value): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $boolean = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

        if ($boolean !== null) {
            $query->where($column, $boolean);
        }
    }

    private function applyPriceFilter(Builder $query, string $operator, mixed $value): void
    {
        if (is_numeric($value) && (float) $value >= 0) {
            $query->where('price', $operator, $value);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function applyNumericDefaults(array &$data, bool $creating = true): void
    {
        $defaults = [
            'stock_quantity' => 0,
            'low_stock_threshold' => 5,
            'sort_order' => 0,
        ];

        foreach ($defaults as $field => $default) {
            $shouldDefault = $creating
                ? ! array_key_exists($field, $data) || $data[$field] === null
                : array_key_exists($field, $data) && $data[$field] === null;

            if ($shouldDefault) {
                $data[$field] = $default;
            }
        }
    }

    private function generateUniqueSlug(string $name, ?Product $ignoredProduct = null): string
    {
        $baseSlug = Str::slug($name) ?: 'product';
        $slug = $baseSlug;
        $suffix = 2;

        while ($this->slugExists($slug, $ignoredProduct)) {
            $slug = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    private function slugExists(string $slug, ?Product $ignoredProduct): bool
    {
        return Product::withTrashed()
            ->where('slug', $slug)
            ->when(
                $ignoredProduct,
                fn (Builder $query) => $query->whereKeyNot($ignoredProduct->getKey()),
            )
            ->exists();
    }
}
