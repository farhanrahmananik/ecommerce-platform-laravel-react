<?php

namespace Tests\Feature\Storefront;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StorefrontProductListingTest extends TestCase
{
    use RefreshDatabase;

    private int $categorySequence = 0;

    private int $productSequence = 0;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
    }

    public function test_a_guest_can_list_active_storefront_categories(): void
    {
        $this->createCategory([
            'name' => 'Home',
            'slug' => 'home',
            'description' => 'Home essentials.',
        ]);
        $this->createCategory([
            'name' => 'Apparel',
            'slug' => 'apparel',
        ]);
        $this->createCategory([
            'name' => 'Hidden',
            'slug' => 'hidden',
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/storefront/categories');

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'Apparel')
            ->assertJsonPath('data.1.name', 'Home')
            ->assertJsonPath('data.1.description', 'Home essentials.')
            ->assertJsonMissingPath('data.0.is_active');
    }

    public function test_a_guest_can_list_storefront_products(): void
    {
        $this->createProduct([
            'name' => 'Public Product',
            'slug' => 'public-product',
            'short_description' => 'Made for the storefront.',
            'price' => 99.95,
        ]);

        $response = $this->getJson('/api/storefront/products');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Public Product')
            ->assertJsonPath('data.0.short_description', 'Made for the storefront.')
            ->assertJsonPath('data.0.price', '99.95')
            ->assertJsonPath('data.0.effective_price', '99.95')
            ->assertJsonPath('meta.per_page', 12)
            ->assertJsonMissingPath('data.0.cost_price');
    }

    public function test_inactive_products_are_hidden_from_the_storefront(): void
    {
        $this->createProduct([
            'name' => 'Visible Product',
            'slug' => 'visible-product',
        ]);
        $this->createProduct([
            'name' => 'Inactive Product',
            'slug' => 'inactive-product',
            'is_active' => false,
        ]);

        $this->getJson('/api/storefront/products')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Visible Product');
    }

    public function test_product_listing_includes_category_and_primary_image_data(): void
    {
        $category = $this->createCategory([
            'name' => 'Accessories',
            'slug' => 'accessories',
        ]);
        $product = $this->createProduct([
            'category_id' => $category->id,
            'name' => 'Canvas Bag',
            'slug' => 'canvas-bag',
        ]);
        $primaryImage = ProductImage::query()->create([
            'product_id' => $product->id,
            'image_path' => 'product-images/canvas-bag.png',
            'alt_text' => 'Canvas bag in natural fabric',
            'is_primary' => true,
            'sort_order' => 2,
        ]);
        ProductImage::query()->create([
            'product_id' => $product->id,
            'image_path' => 'product-images/secondary.png',
            'is_primary' => false,
            'sort_order' => 1,
        ]);

        $response = $this->getJson('/api/storefront/products');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.category.id', $category->id)
            ->assertJsonPath('data.0.category.slug', 'accessories')
            ->assertJsonPath('data.0.primary_image.id', $primaryImage->id)
            ->assertJsonPath(
                'data.0.primary_image.url',
                Storage::disk('public')->url($primaryImage->image_path),
            )
            ->assertJsonPath(
                'data.0.primary_image.alt_text',
                'Canvas bag in natural fabric',
            )
            ->assertJsonPath('data.0.primary_image.is_primary', true);
    }

    public function test_search_filter_matches_product_content(): void
    {
        $this->createProduct([
            'name' => 'Everyday Backpack',
            'slug' => 'everyday-backpack',
            'short_description' => 'Durable canvas for daily travel.',
        ]);
        $this->createProduct([
            'name' => 'Desk Lamp',
            'slug' => 'desk-lamp',
            'short_description' => 'Warm light for focused work.',
        ]);

        $this->getJson('/api/storefront/products?search=canvas')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Everyday Backpack');
    }

    public function test_category_slug_filter_works(): void
    {
        $apparel = $this->createCategory([
            'name' => 'Apparel',
            'slug' => 'apparel',
        ]);
        $home = $this->createCategory([
            'name' => 'Home',
            'slug' => 'home',
        ]);
        $this->createProduct([
            'category_id' => $apparel->id,
            'name' => 'Classic Shirt',
            'slug' => 'classic-shirt',
        ]);
        $this->createProduct([
            'category_id' => $home->id,
            'name' => 'Table Lamp',
            'slug' => 'table-lamp',
        ]);

        $this->getJson('/api/storefront/products?category=apparel')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Classic Shirt')
            ->assertJsonPath('data.0.category.slug', 'apparel');
    }

    public function test_featured_filter_works(): void
    {
        $this->createProduct([
            'name' => 'Featured Product',
            'slug' => 'featured-product',
            'is_featured' => true,
        ]);
        $this->createProduct([
            'name' => 'Regular Product',
            'slug' => 'regular-product',
            'is_featured' => false,
        ]);

        $this->getJson('/api/storefront/products?featured=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Featured Product')
            ->assertJsonPath('data.0.is_featured', true);
    }

    public function test_products_can_be_sorted_by_effective_price_ascending(): void
    {
        $this->createProduct([
            'name' => 'Sale Product',
            'slug' => 'sale-product',
            'price' => 100,
            'sale_price' => 80,
        ]);
        $this->createProduct([
            'name' => 'Budget Product',
            'slug' => 'budget-product',
            'price' => 50,
            'sale_price' => null,
        ]);
        $this->createProduct([
            'name' => 'Invalid Sale Product',
            'slug' => 'invalid-sale-product',
            'price' => 70,
            'sale_price' => 90,
        ]);

        $response = $this->getJson('/api/storefront/products?sort=price_asc');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Budget Product')
            ->assertJsonPath('data.0.effective_price', '50.00')
            ->assertJsonPath('data.1.name', 'Invalid Sale Product')
            ->assertJsonPath('data.1.effective_price', '70.00')
            ->assertJsonPath('data.2.name', 'Sale Product')
            ->assertJsonPath('data.2.effective_price', '80.00');
    }

    public function test_per_page_validation_rejects_values_over_48(): void
    {
        $this->getJson('/api/storefront/products?per_page=49')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['per_page']);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createCategory(array $overrides = []): Category
    {
        $this->categorySequence++;

        return Category::query()->create(array_merge([
            'name' => "Category {$this->categorySequence}",
            'slug' => "category-{$this->categorySequence}",
            'is_active' => true,
        ], $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createProduct(array $overrides = []): Product
    {
        $this->productSequence++;

        return Product::query()->create(array_merge([
            'name' => "Product {$this->productSequence}",
            'slug' => "product-{$this->productSequence}",
            'sku' => "STOREFRONT-{$this->productSequence}",
            'price' => 100,
            'is_active' => true,
            'is_featured' => false,
        ], $overrides));
    }
}
