<?php

namespace Tests\Feature\Admin;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_unauthenticated_user_cannot_access_the_product_index(): void
    {
        $this->getJson('/api/admin/products')->assertUnauthorized();
    }

    public function test_an_authenticated_user_can_list_products(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $this->createProduct([
            'name' => 'Second Product',
            'slug' => 'second-product',
            'sku' => 'SKU-002',
            'sort_order' => 2,
        ]);
        $this->createProduct([
            'name' => 'First Product',
            'slug' => 'first-product',
            'sku' => 'SKU-001',
            'sort_order' => 1,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson('/api/admin/products');

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'First Product')
            ->assertJsonPath('data.1.name', 'Second Product');
    }

    public function test_an_authenticated_user_can_create_a_product(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $category = $this->createCategory();

        $response = $this
            ->actingAs($user, 'web')
            ->postJson('/api/admin/products', [
                'category_id' => $category->id,
                'name' => 'Everyday Backpack',
                'slug' => 'everyday-backpack',
                'sku' => 'BAG-100',
                'short_description' => 'A practical everyday bag.',
                'price' => 149.99,
                'sale_price' => 129.99,
                'cost_price' => 70,
                'stock_quantity' => 20,
                'low_stock_threshold' => 4,
                'is_active' => true,
                'is_featured' => true,
                'sort_order' => 3,
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Everyday Backpack')
            ->assertJsonPath('data.sku', 'BAG-100')
            ->assertJsonPath('data.price', '149.99')
            ->assertJsonPath('data.sale_price', '129.99')
            ->assertJsonPath('data.category.id', $category->id)
            ->assertJsonPath('data.is_featured', true);

        $this->assertDatabaseHas('products', [
            'name' => 'Everyday Backpack',
            'slug' => 'everyday-backpack',
            'sku' => 'BAG-100',
            'category_id' => $category->id,
        ]);
    }

    public function test_a_unique_slug_is_generated_when_it_is_missing(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $this->createProduct([
            'name' => 'Classic Tee',
            'slug' => 'classic-tee',
            'sku' => 'TEE-001',
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->postJson('/api/admin/products', [
                'name' => 'Classic Tee',
                'sku' => 'TEE-002',
                'price' => 29.99,
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.slug', 'classic-tee-2');

        $this->assertDatabaseHas('products', ['slug' => 'classic-tee-2']);
    }

    public function test_validation_errors_are_returned_for_invalid_product_data(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $response = $this
            ->actingAs($user, 'web')
            ->postJson('/api/admin/products', [
                'name' => '',
                'sku' => '',
                'category_id' => 9999,
                'price' => -1,
                'stock_quantity' => -1,
                'low_stock_threshold' => -1,
                'sort_order' => -1,
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name',
                'sku',
                'category_id',
                'price',
                'stock_quantity',
                'low_stock_threshold',
                'sort_order',
            ]);
    }

    public function test_sale_price_cannot_be_greater_than_price(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $this
            ->actingAs($user, 'web')
            ->postJson('/api/admin/products', [
                'name' => 'Invalid Sale',
                'sku' => 'SALE-001',
                'price' => 100,
                'sale_price' => 120,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['sale_price']);
    }

    public function test_update_sale_price_is_compared_with_the_existing_price(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $product = $this->createProduct([
            'price' => 100,
            'sale_price' => null,
        ]);

        $this
            ->actingAs($user, 'web')
            ->patchJson("/api/admin/products/{$product->id}", [
                'sale_price' => 120,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['sale_price']);
    }

    public function test_an_authenticated_user_can_update_a_product(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $product = $this->createProduct([
            'name' => 'Old Product',
            'slug' => 'old-product',
            'sku' => 'OLD-001',
            'stock_quantity' => 12,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->patchJson("/api/admin/products/{$product->id}", [
                'name' => 'Updated Product',
                'sku' => 'NEW-001',
                'price' => 120,
                'sale_price' => 99,
                'is_featured' => true,
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Product')
            ->assertJsonPath('data.slug', 'updated-product')
            ->assertJsonPath('data.sku', 'NEW-001')
            ->assertJsonPath('data.sale_price', '99.00')
            ->assertJsonPath('data.stock_quantity', 12)
            ->assertJsonPath('data.is_featured', true);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Updated Product',
            'slug' => 'updated-product',
            'sku' => 'NEW-001',
            'stock_quantity' => 12,
        ]);

        $auditLog = AuditLog::query()->where('event', 'product.updated')->sole();

        $this->assertSame($user->id, $auditLog->user_id);
        $this->assertSame('products', $auditLog->module);
        $this->assertSame('updated', $auditLog->action);
        $this->assertSame(Product::class, $auditLog->auditable_type);
        $this->assertSame($product->id, $auditLog->auditable_id);
        $this->assertSame('Old Product', $auditLog->old_values['name']);
        $this->assertSame('Updated Product', $auditLog->new_values['name']);
    }

    public function test_an_authenticated_user_can_filter_products_by_category(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $firstCategory = $this->createCategory([
            'name' => 'Apparel',
            'slug' => 'apparel',
        ]);
        $secondCategory = $this->createCategory([
            'name' => 'Accessories',
            'slug' => 'accessories',
        ]);

        $this->createProduct([
            'category_id' => $firstCategory->id,
            'name' => 'T-Shirt',
            'slug' => 't-shirt',
            'sku' => 'TEE-100',
        ]);
        $this->createProduct([
            'category_id' => $secondCategory->id,
            'name' => 'Cap',
            'slug' => 'cap',
            'sku' => 'CAP-100',
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson("/api/admin/products?category_id={$firstCategory->id}");

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'T-Shirt')
            ->assertJsonPath('data.0.category.id', $firstCategory->id);
    }

    public function test_an_authenticated_user_can_filter_featured_products(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $this->createProduct([
            'name' => 'Featured Product',
            'slug' => 'featured-product',
            'sku' => 'FEATURED-001',
            'is_featured' => true,
        ]);
        $this->createProduct([
            'name' => 'Standard Product',
            'slug' => 'standard-product',
            'sku' => 'STANDARD-001',
            'is_featured' => false,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson('/api/admin/products?is_featured=1');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Featured Product')
            ->assertJsonPath('data.0.is_featured', true);
    }

    public function test_an_authenticated_user_can_delete_a_product(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $product = $this->createProduct();

        $response = $this
            ->actingAs($user, 'web')
            ->deleteJson("/api/admin/products/{$product->id}");

        $response
            ->assertOk()
            ->assertExactJson([
                'message' => 'Product deleted successfully.',
            ]);

        $this->assertSoftDeleted($product);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createCategory(array $overrides = []): Category
    {
        return Category::query()->create(array_merge([
            'name' => 'General',
            'slug' => 'general',
        ], $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createProduct(array $overrides = []): Product
    {
        return Product::query()->create(array_merge([
            'name' => 'Test Product',
            'slug' => 'test-product',
            'sku' => 'TEST-001',
            'price' => 100,
        ], $overrides));
    }
}
