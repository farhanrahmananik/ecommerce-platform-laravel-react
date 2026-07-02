<?php

namespace Tests\Feature\Checkout;

use App\Models\Cart;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutApiTest extends TestCase
{
    use RefreshDatabase;

    private int $productSequence = 0;

    public function test_an_unauthenticated_user_cannot_checkout(): void
    {
        $this->postJson('/api/checkout', $this->checkoutPayload())
            ->assertUnauthorized();
    }

    public function test_an_authenticated_user_cannot_checkout_with_an_empty_cart(): void
    {
        $user = User::factory()->create();

        $this
            ->actingAs($user, 'web')
            ->postJson('/api/checkout', $this->checkoutPayload())
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['cart'])
            ->assertJsonPath('errors.cart.0', 'Your cart is empty.');

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_an_authenticated_user_can_checkout_with_cart_items(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct([
            'name' => 'Leather Weekender',
            'sku' => 'BAG-001',
        ]);
        $this->addCartItem($user, $product, 2, '79.95');

        $response = $this
            ->actingAs($user, 'web')
            ->postJson('/api/checkout', $this->checkoutPayload());

        $response
            ->assertCreated()
            ->assertJsonPath('data.customer_name', 'Farhan Rahman')
            ->assertJsonPath('data.shipping_address.city', 'Berlin')
            ->assertJsonPath('data.billing_same_as_shipping', true)
            ->assertJsonPath('data.billing_address.line1', 'Alexanderplatz 1')
            ->assertJsonPath('data.subtotal', '159.90')
            ->assertJsonPath('data.shipping_amount', '0.00')
            ->assertJsonPath('data.discount_amount', '0.00')
            ->assertJsonPath('data.tax_amount', '0.00')
            ->assertJsonPath('data.total', '159.90')
            ->assertJsonPath('data.payment_method', 'cash_on_delivery')
            ->assertJsonPath('data.payment_status', 'pending')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.items.0.product_name', 'Leather Weekender')
            ->assertJsonPath('data.items.0.product_sku', 'BAG-001')
            ->assertJsonPath('data.items.0.quantity', 2)
            ->assertJsonPath('data.items.0.line_total', '159.90');

        $this->assertMatchesRegularExpression(
            '/^ORD-\d{8}-[A-Z0-9]{6}$/',
            $response->json('data.order_number'),
        );
    }

    public function test_checkout_creates_an_order_and_order_items(): void
    {
        $user = User::factory()->create();
        $firstProduct = $this->createProduct([
            'name' => 'Travel Backpack',
            'sku' => 'TRAVEL-001',
        ]);
        $secondProduct = $this->createProduct([
            'name' => 'Packing Cubes',
            'sku' => 'TRAVEL-002',
        ]);

        $this->addCartItem($user, $firstProduct, 1, '120.00');
        $this->addCartItem($user, $secondProduct, 3, '15.50');

        $response = $this
            ->actingAs($user, 'web')
            ->postJson('/api/checkout', $this->checkoutPayload())
            ->assertCreated()
            ->assertJsonCount(2, 'data.items')
            ->assertJsonPath('data.total', '166.50');

        $orderId = $response->json('data.id');

        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'user_id' => $user->id,
            'customer_email' => 'farhan@example.com',
            'subtotal' => '166.50',
            'total' => '166.50',
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('order_items', [
            'order_id' => $orderId,
            'product_id' => $firstProduct->id,
            'product_name' => 'Travel Backpack',
            'product_sku' => 'TRAVEL-001',
            'quantity' => 1,
            'unit_price' => '120.00',
            'line_total' => '120.00',
        ]);
        $this->assertDatabaseHas('order_items', [
            'order_id' => $orderId,
            'product_id' => $secondProduct->id,
            'quantity' => 3,
            'line_total' => '46.50',
        ]);
    }

    public function test_checkout_clears_cart_items_after_success(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct();
        $cart = $this->addCartItem($user, $product, 2, '25.00');

        $this
            ->actingAs($user, 'web')
            ->postJson('/api/checkout', $this->checkoutPayload())
            ->assertCreated();

        $this->assertDatabaseHas('carts', [
            'id' => $cart->id,
            'user_id' => $user->id,
        ]);
        $this->assertDatabaseMissing('cart_items', ['cart_id' => $cart->id]);
    }

    public function test_checkout_requires_billing_fields_when_not_using_shipping_address(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct();
        $this->addCartItem($user, $product);
        $payload = $this->checkoutPayload([
            'billing_same_as_shipping' => false,
        ]);

        $this
            ->actingAs($user, 'web')
            ->postJson('/api/checkout', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'billing_address_line1',
                'billing_city',
                'billing_postal_code',
                'billing_country',
            ]);

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('cart_items', 1);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function checkoutPayload(array $overrides = []): array
    {
        return array_merge([
            'customer_name' => 'Farhan Rahman',
            'customer_email' => 'farhan@example.com',
            'customer_phone' => '+49 30 123456',
            'shipping_address_line1' => 'Alexanderplatz 1',
            'shipping_address_line2' => 'Apartment 4',
            'shipping_city' => 'Berlin',
            'shipping_state' => 'Berlin',
            'shipping_postal_code' => '10178',
            'shipping_country' => 'Germany',
            'billing_same_as_shipping' => true,
            'payment_method' => 'cash_on_delivery',
            'notes' => 'Please leave the parcel at reception.',
        ], $overrides);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createProduct(array $overrides = []): Product
    {
        $this->productSequence++;

        return Product::query()->create(array_merge([
            'name' => "Checkout Product {$this->productSequence}",
            'slug' => "checkout-product-{$this->productSequence}",
            'sku' => "CHECKOUT-{$this->productSequence}",
            'price' => 100,
            'stock_quantity' => 10,
            'is_active' => true,
        ], $overrides));
    }

    private function addCartItem(
        User $user,
        Product $product,
        int $quantity = 1,
        string $unitPrice = '100.00',
    ): Cart {
        $cart = $user->cart()->firstOrCreate();

        $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'line_total' => number_format((float) $unitPrice * $quantity, 2, '.', ''),
        ]);

        return $cart;
    }
}
