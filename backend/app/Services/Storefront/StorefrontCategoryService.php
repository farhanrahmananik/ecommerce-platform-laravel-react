<?php

namespace App\Services\Storefront;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;

class StorefrontCategoryService
{
    /**
     * Get active storefront categories in a stable order.
     *
     * @return Collection<int, Category>
     */
    public function getActiveCategories(): Collection
    {
        return Category::query()
            ->active()
            ->orderBy('name')
            ->orderBy('id')
            ->get();
    }
}
