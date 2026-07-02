<?php

namespace Tests\Feature\Storefront;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StorefrontProductDetailsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
    }

    public function test_a_guest_can_view_an_active_product_by_slug(): void
    {
        $category = $this->createCategory();
        $product = $this->createProduct([
            'category_id' => $category->id,
            'name' => 'Canvas Weekend Bag',
            'slug' => 'canvas-weekend-bag',
            'sku' => 'BAG-DETAIL-001',
            'short_description' => 'A compact bag for short trips.',
            'description' => 'Durable canvas construction with practical storage.',
            'price' => 120,
            'sale_price' => 95,
            'is_featured' => true,
        ]);

        $response = $this->getJson(
            "/api/storefront/products/{$product->slug}",
        );

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $product->id)
            ->assertJsonPath('data.name', 'Canvas Weekend Bag')
            ->assertJsonPath('data.slug', 'canvas-weekend-bag')
            ->assertJsonPath('data.sku', 'BAG-DETAIL-001')
            ->assertJsonPath('data.short_description', 'A compact bag for short trips.')
            ->assertJsonPath('data.price', '120.00')
            ->assertJsonPath('data.sale_price', '95.00')
            ->assertJsonPath('data.effective_price', '95.00')
            ->assertJsonPath('data.is_featured', true)
            ->assertJsonPath('data.category.id', $category->id)
            ->assertJsonPath('data.category.slug', $category->slug);
    }

    public function test_product_details_include_description_and_ordered_images(): void
    {
        $product = $this->createProduct([
            'description' => 'Complete long-form product information.',
        ]);
        $primaryImage = $this->createImage($product, [
            'image_path' => 'product-images/primary.png',
            'alt_text' => 'Primary product view',
            'is_primary' => true,
            'sort_order' => 20,
        ]);
        $firstGalleryImage = $this->createImage($product, [
            'image_path' => 'product-images/first.png',
            'alt_text' => 'First gallery view',
            'sort_order' => 5,
        ]);
        $lastGalleryImage = $this->createImage($product, [
            'image_path' => 'product-images/last.png',
            'alt_text' => 'Last gallery view',
            'sort_order' => 30,
        ]);

        $response = $this->getJson(
            "/api/storefront/products/{$product->slug}",
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.description',
                'Complete long-form product information.',
            )
            ->assertJsonPath('data.primary_image.id', $primaryImage->id)
            ->assertJsonPath(
                'data.primary_image.url',
                Storage::disk('public')->url($primaryImage->image_path),
            )
            ->assertJsonCount(3, 'data.images')
            ->assertJsonPath('data.images.0.id', $firstGalleryImage->id)
            ->assertJsonPath('data.images.1.id', $primaryImage->id)
            ->assertJsonPath('data.images.2.id', $lastGalleryImage->id)
            ->assertJsonPath('data.images.0.alt_text', 'First gallery view');
    }

    public function test_an_inactive_product_is_not_visible(): void
    {
        $product = $this->createProduct([
            'slug' => 'inactive-product',
            'is_active' => false,
        ]);

        $this->getJson("/api/storefront/products/{$product->slug}")
            ->assertNotFound();
    }

    public function test_a_missing_product_slug_returns_not_found(): void
    {
        $this->getJson('/api/storefront/products/missing-product')
            ->assertNotFound();
    }

    private function createCategory(): Category
    {
        return Category::query()->create([
            'name' => 'Travel',
            'slug' => 'travel',
            'is_active' => true,
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createProduct(array $overrides = []): Product
    {
        return Product::query()->create(array_merge([
            'name' => 'Detail Product',
            'slug' => 'detail-product',
            'sku' => 'DETAIL-001',
            'price' => 100,
            'is_active' => true,
            'is_featured' => false,
        ], $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createImage(
        Product $product,
        array $overrides = [],
    ): ProductImage {
        return ProductImage::query()->create(array_merge([
            'product_id' => $product->id,
            'image_path' => 'product-images/default.png',
            'is_primary' => false,
            'sort_order' => 0,
        ], $overrides));
    }
}
