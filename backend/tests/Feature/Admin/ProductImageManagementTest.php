<?php

namespace Tests\Feature\Admin;

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class ProductImageManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
    }

    public function test_an_authenticated_admin_capable_user_can_upload_a_product_image(): void
    {
        $user = $this->createAdminUser();
        $product = $this->createProduct();
        $image = UploadedFile::fake()->image('backpack.png', 800, 600)->size(256);

        $response = $this->uploadImage($user, $product, [
            'image' => $image,
            'alt_text' => 'A canvas backpack',
            'sort_order' => 4,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.product_id', $product->id)
            ->assertJsonPath('data.original_name', 'backpack.png')
            ->assertJsonPath('data.mime_type', 'image/png')
            ->assertJsonPath('data.alt_text', 'A canvas backpack')
            ->assertJsonPath('data.sort_order', 4)
            ->assertJsonPath('data.is_primary', true);

        $imagePath = $response->json('data.image_path');

        $this->assertIsString($imagePath);
        $this->assertStringStartsWith("product-images/{$product->id}/", $imagePath);
        $this->assertNotSame('backpack.png', basename($imagePath));
        Storage::disk('public')->assertExists($imagePath);

        $this->assertDatabaseHas('product_images', [
            'product_id' => $product->id,
            'image_path' => $imagePath,
            'original_name' => 'backpack.png',
            'is_primary' => true,
            'sort_order' => 4,
        ]);
    }

    public function test_the_first_product_image_automatically_becomes_primary(): void
    {
        $user = $this->createAdminUser();
        $product = $this->createProduct();

        $this->uploadImage($user, $product)->assertCreated();

        $this->assertTrue(
            ProductImage::query()->where('product_id', $product->id)->firstOrFail()->is_primary,
        );
    }

    public function test_setting_a_second_image_as_primary_unsets_the_first_image(): void
    {
        $user = $this->createAdminUser();
        $product = $this->createProduct();

        $firstResponse = $this->uploadImage($user, $product, [
            'image' => UploadedFile::fake()->image('first.png'),
        ]);
        $secondResponse = $this->uploadImage($user, $product, [
            'image' => UploadedFile::fake()->image('second.png'),
        ]);

        $this
            ->actingAs($user, 'web')
            ->patchJson(
                "/api/admin/products/{$product->id}/images/{$secondResponse->json('data.id')}",
                ['is_primary' => true],
            )
            ->assertOk()
            ->assertJsonPath('data.is_primary', true);

        $firstImage = ProductImage::query()->findOrFail($firstResponse->json('data.id'));
        $secondImage = ProductImage::query()->findOrFail($secondResponse->json('data.id'));

        $this->assertFalse($firstImage->is_primary);
        $this->assertTrue($secondImage->is_primary);
    }

    public function test_an_authenticated_user_can_list_images_in_stable_display_order(): void
    {
        $user = $this->createAdminUser();
        $product = $this->createProduct();
        $laterImageId = $this->uploadImage($user, $product, [
            'image' => UploadedFile::fake()->image('later.png'),
            'sort_order' => 20,
        ])->json('data.id');
        $earlierImageId = $this->uploadImage($user, $product, [
            'image' => UploadedFile::fake()->image('earlier.png'),
            'sort_order' => 5,
        ])->json('data.id');

        $response = $this
            ->actingAs($user, 'web')
            ->getJson("/api/admin/products/{$product->id}/images");

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $earlierImageId)
            ->assertJsonPath('data.1.id', $laterImageId);

        $this->assertStringContainsString(
            '/storage/product-images/',
            $response->json('data.0.image_url'),
        );
    }

    public function test_product_image_metadata_can_be_updated(): void
    {
        $user = $this->createAdminUser();
        $product = $this->createProduct();
        $imageId = $this->uploadImage($user, $product)->json('data.id');

        $response = $this
            ->actingAs($user, 'web')
            ->patchJson("/api/admin/products/{$product->id}/images/{$imageId}", [
                'alt_text' => 'Updated accessibility text',
                'sort_order' => 25,
                'is_primary' => true,
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.alt_text', 'Updated accessibility text')
            ->assertJsonPath('data.sort_order', 25)
            ->assertJsonPath('data.is_primary', true);

        $this->assertDatabaseHas('product_images', [
            'id' => $imageId,
            'alt_text' => 'Updated accessibility text',
            'sort_order' => 25,
            'is_primary' => true,
        ]);
    }

    public function test_a_product_image_can_be_deleted_with_its_stored_file(): void
    {
        $user = $this->createAdminUser();
        $product = $this->createProduct();
        $uploadResponse = $this->uploadImage($user, $product);
        $imageId = $uploadResponse->json('data.id');
        $imagePath = $uploadResponse->json('data.image_path');

        $response = $this
            ->actingAs($user, 'web')
            ->deleteJson("/api/admin/products/{$product->id}/images/{$imageId}");

        $response
            ->assertOk()
            ->assertExactJson([
                'message' => 'Product image deleted successfully.',
            ]);

        $this->assertDatabaseMissing('product_images', ['id' => $imageId]);
        Storage::disk('public')->assertMissing($imagePath);
    }

    public function test_deleting_the_primary_image_promotes_the_next_image(): void
    {
        $user = $this->createAdminUser();
        $product = $this->createProduct();
        $firstImageId = $this->uploadImage($user, $product, [
            'image' => UploadedFile::fake()->image('first.png'),
            'sort_order' => 10,
        ])->json('data.id');
        $secondImageId = $this->uploadImage($user, $product, [
            'image' => UploadedFile::fake()->image('second.png'),
            'sort_order' => 1,
        ])->json('data.id');

        $this
            ->actingAs($user, 'web')
            ->deleteJson("/api/admin/products/{$product->id}/images/{$firstImageId}")
            ->assertOk();

        $this->assertTrue(ProductImage::query()->findOrFail($secondImageId)->is_primary);
    }

    public function test_an_image_cannot_be_updated_or_deleted_through_another_product(): void
    {
        $user = $this->createAdminUser();
        $firstProduct = $this->createProduct();
        $secondProduct = $this->createProduct([
            'name' => 'Second Product',
            'slug' => 'second-product',
            'sku' => 'SECOND-001',
        ]);
        $imageId = $this->uploadImage($user, $firstProduct)->json('data.id');

        $this
            ->actingAs($user, 'web')
            ->patchJson("/api/admin/products/{$secondProduct->id}/images/{$imageId}", [
                'alt_text' => 'Should not be saved',
            ])
            ->assertNotFound();

        $this
            ->actingAs($user, 'web')
            ->deleteJson("/api/admin/products/{$secondProduct->id}/images/{$imageId}")
            ->assertNotFound();

        $this->assertDatabaseHas('product_images', [
            'id' => $imageId,
            'product_id' => $firstProduct->id,
            'alt_text' => null,
        ]);
    }

    public function test_validation_rejects_a_non_image_upload(): void
    {
        $user = $this->createAdminUser();
        $product = $this->createProduct();

        $this
            ->actingAs($user, 'web')
            ->withHeader('Accept', 'application/json')
            ->post("/api/admin/products/{$product->id}/images", [
                'image' => UploadedFile::fake()->create(
                    'not-an-image.txt',
                    100,
                    'text/plain',
                ),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['image']);

        $this->assertDatabaseCount('product_images', 0);
    }

    private function createAdminUser(): User
    {
        return User::factory()->create(['role' => 'admin']);
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

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function uploadImage(
        User $user,
        Product $product,
        array $overrides = [],
    ): TestResponse {
        return $this
            ->actingAs($user, 'web')
            ->withHeader('Accept', 'application/json')
            ->post(
                "/api/admin/products/{$product->id}/images",
                array_merge([
                    'image' => UploadedFile::fake()->image('product.png'),
                ], $overrides),
            );
    }
}
