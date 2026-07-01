<?php

namespace App\Services\Admin;

use App\Models\Category;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class CategoryService
{
    /**
     * Get a filtered, ordered category page.
     *
     * @param  array<string, mixed>  $filters
     */
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        $query = Category::query()->with('parent');

        $this->applySearchFilter($query, $filters['search'] ?? null);
        $this->applyActiveFilter($query, $filters['is_active'] ?? null);
        $this->applyParentFilter($query, $filters);

        $perPage = max(1, min(50, (int) ($filters['per_page'] ?? 15)));

        return $query
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Create a category.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Category
    {
        $data['slug'] = filled($data['slug'] ?? null)
            ? $data['slug']
            : $this->generateUniqueSlug($data['name']);

        if (($data['sort_order'] ?? null) === null) {
            $data['sort_order'] = 0;
        }

        return Category::create($data)->load('parent');
    }

    /**
     * Update a category.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Category $category, array $data): Category
    {
        if (array_key_exists('name', $data) && ! filled($data['slug'] ?? null)) {
            $data['slug'] = $this->generateUniqueSlug($data['name'], $category);
        } elseif (array_key_exists('slug', $data) && ! filled($data['slug'])) {
            unset($data['slug']);
        }

        if (array_key_exists('sort_order', $data) && $data['sort_order'] === null) {
            $data['sort_order'] = 0;
        }

        $category->update($data);

        return $category->refresh()->load('parent');
    }

    /**
     * Soft delete a category.
     */
    public function delete(Category $category): void
    {
        $category->delete();
    }

    private function applySearchFilter(Builder $query, mixed $search): void
    {
        if (! is_string($search) || blank($search)) {
            return;
        }

        $query->where(function (Builder $query) use ($search): void {
            $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%");
        });
    }

    private function applyActiveFilter(Builder $query, mixed $isActive): void
    {
        if ($isActive === null || $isActive === '') {
            return;
        }

        $active = filter_var($isActive, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

        if ($active !== null) {
            $query->where('is_active', $active);
        }
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function applyParentFilter(Builder $query, array $filters): void
    {
        if (! array_key_exists('parent_id', $filters) || $filters['parent_id'] === '') {
            return;
        }

        if ($filters['parent_id'] === null || $filters['parent_id'] === 'null') {
            $query->whereNull('parent_id');

            return;
        }

        if (is_numeric($filters['parent_id'])) {
            $query->where('parent_id', (int) $filters['parent_id']);
        }
    }

    private function generateUniqueSlug(string $name, ?Category $ignoredCategory = null): string
    {
        $baseSlug = Str::slug($name) ?: 'category';
        $slug = $baseSlug;
        $suffix = 2;

        while ($this->slugExists($slug, $ignoredCategory)) {
            $slug = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    private function slugExists(string $slug, ?Category $ignoredCategory): bool
    {
        return Category::withTrashed()
            ->where('slug', $slug)
            ->when(
                $ignoredCategory,
                fn (Builder $query) => $query->whereKeyNot($ignoredCategory->getKey()),
            )
            ->exists();
    }
}
