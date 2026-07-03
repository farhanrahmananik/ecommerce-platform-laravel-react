<?php

namespace Tests\Feature\Checkout;

use App\Models\AuditLog;
use App\Models\Cart;
use App\Models\Coupon;
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

        $auditLog = AuditLog::query()->where('event', 'checkout.order_placed')->sole();

        $this->assertSame($user->id, $auditLog->user_id);
        $this->assertSame('checkout', $auditLog->module);
        $this->assertSame('placed', $auditLog->action);
        $this->assertSame($response->json('data.id'), $auditLog->auditable_id);
        $this->assertSame('159.90', $auditLog->new_values['total']);
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

    public function test_checkout_can_apply_a_valid_fixed_coupon(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct();
        $this->addCartItem($user, $product, 1, '100.00');
        $coupon = Coupon::factory()->create([
            'code' => 'SAVE25',
            'type' => 'fixed',
            'value' => 25,
        ]);

        $this->actingAs($user, 'web')
            ->postJson('/api/checkout', $this->checkoutPayload([
                'coupon_code' => 'save25',
            ]))
            ->assertCreated()
            ->assertJsonPath('data.coupon_code', 'SAVE25')
            ->assertJsonPath('data.discount_amount', '25.00')
            ->assertJsonPath('data.total', '75.00');

        $this->assertDatabaseHas('orders', [
            'coupon_id' => $coupon->id,
            'coupon_code' => 'SAVE25',
            'discount_amount' => '25.00',
            'total' => '75.00',
        ]);
    }

    public function test_checkout_can_apply_a_valid_percentage_coupon(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct();
        $this->addCartItem($user, $product, 1, '200.00');
        Coupon::factory()->percentage()->create([
            'code' => 'SAVE10',
            'value' => 10,
            'max_discount_amount' => null,
        ]);

        $this->actingAs($user, 'web')
            ->postJson('/api/checkout', $this->checkoutPayload([
                'coupon_code' => 'SAVE10',
            ]))
            ->assertCreated()
            ->assertJsonPath('data.discount_amount', '20.00')
            ->assertJsonPath('data.total', '180.00');
    }

    public function test_coupon_checkout_creates_a_redemption(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct();
        $this->addCartItem($user, $product, 1, '100.00');
        $coupon = Coupon::factory()->create([
            'code' => 'REDEEM20',
            'value' => 20,
        ]);

        $response = $this->actingAs($user, 'web')
            ->postJson('/api/checkout', $this->checkoutPayload([
                'coupon_code' => 'REDEEM20',
            ]))
            ->assertCreated();

        $this->assertDatabaseHas('coupon_redemptions', [
            'coupon_id' => $coupon->id,
            'user_id' => $user->id,
            'order_id' => $response->json('data.id'),
            'coupon_code' => 'REDEEM20',
            'discount_amount' => '20.00',
        ]);
    }

    public function test_coupon_checkout_increments_used_count(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct();
        $this->addCartItem($user, $product);
        $coupon = Coupon::factory()->create([
            'code' => 'COUNTED',
            'used_count' => 2,
        ]);

        $this->actingAs($user, 'web')
            ->postJson('/api/checkout', $this->checkoutPayload([
                'coupon_code' => 'COUNTED',
            ]))
            ->assertCreated();

        $this->assertSame(3, $coupon->refresh()->used_count);
    }

    public function test_checkout_rejects_an_invalid_coupon_code(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct();
        $this->addCartItem($user, $product);

        $this->actingAs($user, 'web')
            ->postJson('/api/checkout', $this->checkoutPayload([
                'coupon_code' => 'MISSING',
            ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('coupon_code')
            ->assertJsonPath(
                'errors.coupon_code.0',
                'The coupon code is invalid.',
            );
    }

    public function test_failed_coupon_checkout_does_not_clear_the_cart(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct();
        $cart = $this->addCartItem($user, $product);

        $this->actingAs($user, 'web')
            ->postJson('/api/checkout', $this->checkoutPayload([
                'coupon_code' => 'MISSING',
            ]))
            ->assertUnprocessable();

        $this->assertDatabaseHas('cart_items', [
            'cart_id' => $cart->id,
            'product_id' => $product->id,
        ]);
    }

    public function test_failed_coupon_checkout_creates_no_order_or_redemption(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct();
        $this->addCartItem($user, $product);
        $coupon = Coupon::factory()->create([
            'code' => 'INACTIVE',
            'is_active' => false,
            'used_count' => 2,
        ]);

        $this->actingAs($user, 'web')
            ->postJson('/api/checkout', $this->checkoutPayload([
                'coupon_code' => 'INACTIVE',
            ]))
            ->assertUnprocessable();

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('coupon_redemptions', 0);
        $this->assertSame(2, $coupon->refresh()->used_count);
    }

    public function test_coupon_discount_cannot_make_order_total_negative(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct();
        $this->addCartItem($user, $product, 1, '40.00');
        Coupon::factory()->create([
            'code' => 'BIGSAVE',
            'type' => 'fixed',
            'value' => 500,
        ]);

        $this->actingAs($user, 'web')
            ->postJson('/api/checkout', $this->checkoutPayload([
                'coupon_code' => 'BIGSAVE',
            ]))
            ->assertCreated()
            ->assertJsonPath('data.discount_amount', '40.00')
            ->assertJsonPath('data.total', '0.00');
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
