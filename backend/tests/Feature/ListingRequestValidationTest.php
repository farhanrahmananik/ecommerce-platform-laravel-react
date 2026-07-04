<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ListingRequestValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_existing_listing_filter_shapes_are_accepted(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $category = Category::query()->create([
            'name' => 'Validated Category',
            'slug' => 'validated-category',
            'is_active' => true,
        ]);
        $product = Product::factory()->create([
            'category_id' => $category->getKey(),
            'is_active' => true,
        ]);

        $adminEndpoints = [
            '/api/admin/categories?is_active=1&parent_id=null&per_page=15&page=1',
            "/api/admin/products?category_id={$category->getKey()}&is_active=1&is_featured=0&per_page=15&page=1",
            '/api/admin/coupons?status=active&type=fixed&per_page=15&page=1',
            '/api/admin/orders?status=pending&search=order&per_page=15&page=1',
            "/api/admin/product-reviews?status=pending&rating=5&product_id={$product->getKey()}&per_page=15&page=1",
            '/api/admin/stock/products?low_stock=1&per_page=15&page=1',
            "/api/admin/stock/products/{$product->getKey()}/movements?per_page=10&page=1",
        ];

        foreach ($adminEndpoints as $endpoint) {
            $this->actingAs($admin, 'web')->getJson($endpoint)->assertOk();
        }

        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($customer, 'web')
            ->getJson('/api/orders?status=pending&per_page=8&page=1')
            ->assertOk();
        $this->actingAs($customer, 'web')
            ->getJson('/api/account/reviews?status=pending&per_page=8&page=1')
            ->assertOk();
        $this->getJson(
            "/api/storefront/products/{$product->slug}/reviews?rating=5&per_page=6&page=1",
        )->assertOk();
    }

    public function test_invalid_listing_filters_are_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $product = Product::factory()->create(['is_active' => true]);
        $adminEndpoints = [
            ['/api/admin/categories?is_active=invalid', 'is_active'],
            ['/api/admin/products?category_id=invalid', 'category_id'],
            ['/api/admin/coupons?status=expired', 'status'],
            ['/api/admin/orders?status=unknown', 'status'],
            ['/api/admin/product-reviews?rating=6', 'rating'],
            ['/api/admin/stock/products?low_stock=invalid', 'low_stock'],
            [
                "/api/admin/stock/products/{$product->getKey()}/movements?per_page=51",
                'per_page',
            ],
        ];

        foreach ($adminEndpoints as [$endpoint, $field]) {
            $this->actingAs($admin, 'web')
                ->getJson($endpoint)
                ->assertUnprocessable()
                ->assertJsonValidationErrors($field);
        }

        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($customer, 'web')
            ->getJson('/api/orders?status=unknown')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');
        $this->actingAs($customer, 'web')
            ->getJson('/api/account/reviews?status=unknown')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');
        $this->getJson(
            "/api/storefront/products/{$product->slug}/reviews?rating=6",
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('rating');
    }
}
