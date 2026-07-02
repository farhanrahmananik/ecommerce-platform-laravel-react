<?php

namespace Tests\Feature\Cart;

use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class CartApiTest extends TestCase
{
    use RefreshDatabase;

    private int $productSequence = 0;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
    }

    public function test_an_unauthenticated_user_cannot_access_the_cart(): void
    {
        $this->getJson('/api/cart')->assertUnauthorized();
    }

    public function test_an_authenticated_user_can_view_an_empty_cart(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user, 'web')
            ->getJson('/api/cart');

        $response
            ->assertOk()
            ->assertJsonCount(0, 'data.items')
            ->assertJsonPath('data.items_count', 0)
            ->assertJsonPath('data.subtotal', '0.00')
            ->assertJsonPath('data.total', '0.00');

        $this->assertDatabaseHas('carts', ['user_id' => $user->id]);
    }

    public function test_an_authenticated_user_can_add_a_product_to_the_cart(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct([
            'name' => 'Canvas Backpack',
            'slug' => 'canvas-backpack',
            'price' => 100,
            'sale_price' => 80,
        ]);
        $image = ProductImage::query()->create([
            'product_id' => $product->id,
            'image_path' => 'product-images/canvas-backpack.png',
            'is_primary' => true,
        ]);

        $response = $this->addProduct($user, $product, 2);

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items_count', 2)
            ->assertJsonPath('data.items.0.product_id', $product->id)
            ->assertJsonPath('data.items.0.product_name', 'Canvas Backpack')
            ->assertJsonPath('data.items.0.product_slug', 'canvas-backpack')
            ->assertJsonPath(
                'data.items.0.product_image_url',
                Storage::disk('public')->url($image->image_path),
            )
            ->assertJsonPath('data.items.0.quantity', 2)
            ->assertJsonPath('data.items.0.unit_price', '80.00')
            ->assertJsonPath('data.items.0.line_total', '160.00')
            ->assertJsonPath('data.subtotal', '160.00')
            ->assertJsonPath('data.total', '160.00');
    }

    public function test_adding_the_same_product_again_merges_quantity(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct(['stock_quantity' => 10]);

        $this->addProduct($user, $product, 2)->assertOk();
        $response = $this->addProduct($user, $product, 3);

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items_count', 5)
            ->assertJsonPath('data.items.0.quantity', 5)
            ->assertJsonPath('data.items.0.line_total', '500.00');

        $this->assertDatabaseCount('cart_items', 1);
    }

    public function test_an_authenticated_user_can_update_cart_item_quantity(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct(['price' => 25]);
        $itemId = $this->addProduct($user, $product)->json('data.items.0.id');

        $response = $this
            ->actingAs($user, 'web')
            ->patchJson("/api/cart/items/{$itemId}", ['quantity' => 4]);

        $response
            ->assertOk()
            ->assertJsonPath('data.items_count', 4)
            ->assertJsonPath('data.items.0.quantity', 4)
            ->assertJsonPath('data.items.0.line_total', '100.00')
            ->assertJsonPath('data.total', '100.00');
    }

    public function test_an_authenticated_user_can_remove_a_cart_item(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct();
        $itemId = $this->addProduct($user, $product)->json('data.items.0.id');

        $response = $this
            ->actingAs($user, 'web')
            ->deleteJson("/api/cart/items/{$itemId}");

        $response
            ->assertOk()
            ->assertJsonCount(0, 'data.items')
            ->assertJsonPath('data.items_count', 0)
            ->assertJsonPath('data.total', '0.00');

        $this->assertDatabaseMissing('cart_items', ['id' => $itemId]);
    }

    public function test_an_authenticated_user_can_clear_the_cart(): void
    {
        $user = User::factory()->create();
        $firstProduct = $this->createProduct();
        $secondProduct = $this->createProduct();

        $this->addProduct($user, $firstProduct)->assertOk();
        $this->addProduct($user, $secondProduct, 2)->assertOk();

        $response = $this
            ->actingAs($user, 'web')
            ->deleteJson('/api/cart');

        $response
            ->assertOk()
            ->assertJsonCount(0, 'data.items')
            ->assertJsonPath('data.items_count', 0)
            ->assertJsonPath('data.subtotal', '0.00');

        $this->assertDatabaseCount('cart_items', 0);
        $this->assertDatabaseHas('carts', ['user_id' => $user->id]);
    }

    public function test_a_user_cannot_update_another_users_cart_item(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $product = $this->createProduct();
        $item = $this->createCartItem($owner, $product);

        $this
            ->actingAs($otherUser, 'web')
            ->patchJson("/api/cart/items/{$item->id}", ['quantity' => 3])
            ->assertNotFound();

        $this->assertDatabaseHas('cart_items', [
            'id' => $item->id,
            'quantity' => 1,
        ]);
    }

    public function test_a_user_cannot_delete_another_users_cart_item(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $product = $this->createProduct();
        $item = $this->createCartItem($owner, $product);

        $this
            ->actingAs($otherUser, 'web')
            ->deleteJson("/api/cart/items/{$item->id}")
            ->assertNotFound();

        $this->assertDatabaseHas('cart_items', ['id' => $item->id]);
    }

    public function test_inactive_and_out_of_stock_products_cannot_be_added(): void
    {
        $user = User::factory()->create();
        $inactiveProduct = $this->createProduct([
            'is_active' => false,
            'stock_quantity' => 10,
        ]);
        $outOfStockProduct = $this->createProduct([
            'is_active' => true,
            'stock_quantity' => 0,
        ]);

        $this->addProduct($user, $inactiveProduct)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['product_id']);

        $this->addProduct($user, $outOfStockProduct)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['quantity']);

        $this->assertDatabaseCount('cart_items', 0);
    }

    public function test_cart_quantity_cannot_exceed_available_stock(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct(['stock_quantity' => 2]);

        $this->addProduct($user, $product, 3)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['quantity']);

        $this->assertDatabaseCount('cart_items', 0);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createProduct(array $overrides = []): Product
    {
        $this->productSequence++;

        return Product::query()->create(array_merge([
            'name' => "Cart Product {$this->productSequence}",
            'slug' => "cart-product-{$this->productSequence}",
            'sku' => "CART-{$this->productSequence}",
            'price' => 100,
            'stock_quantity' => 10,
            'is_active' => true,
        ], $overrides));
    }

    private function addProduct(
        User $user,
        Product $product,
        int $quantity = 1,
    ): TestResponse {
        return $this
            ->actingAs($user, 'web')
            ->postJson('/api/cart/items', [
                'product_id' => $product->id,
                'quantity' => $quantity,
            ]);
    }

    private function createCartItem(
        User $user,
        Product $product,
        int $quantity = 1,
    ): CartItem {
        $cart = $user->cart()->create();

        return $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => $quantity,
            'unit_price' => $product->price,
            'line_total' => (float) $product->price * $quantity,
        ]);
    }
}
