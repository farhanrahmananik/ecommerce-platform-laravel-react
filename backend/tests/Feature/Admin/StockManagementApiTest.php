<?php

namespace Tests\Feature\Admin;

use App\Models\AuditLog;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockManagementApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_stock_products(): void
    {
        $this->getJson('/api/admin/stock/products')->assertUnauthorized();
    }

    public function test_customer_cannot_access_admin_stock_routes(): void
    {
        $user = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create();
        $this->actingAs($user)->getJson('/api/admin/stock/products')->assertForbidden();
        $this->actingAs($user)->postJson("/api/admin/stock/products/{$product->id}/adjust", ['quantity' => 5])->assertForbidden();
    }

    public function test_admin_can_list_stock_products(): void
    {
        $admin = $this->admin();
        $product = Product::factory()->create(['stock_quantity' => 7]);
        $this->actingAs($admin)->getJson('/api/admin/stock/products')->assertOk()->assertJsonPath('data.0.id', $product->id)->assertJsonPath('data.0.stock_quantity', 7);
    }

    public function test_admin_can_view_product_stock_movements(): void
    {
        $admin = $this->admin();
        $product = Product::factory()->create();
        $movement = $product->stockMovements()->create(['type' => StockMovement::TYPE_MANUAL_ADJUSTMENT, 'quantity_before' => 3, 'quantity_changed' => 2, 'quantity_after' => 5, 'created_by_id' => $admin->id]);
        $this->actingAs($admin)->getJson("/api/admin/stock/products/{$product->id}/movements")->assertOk()->assertJsonPath('data.0.id', $movement->id);
    }

    public function test_admin_can_adjust_stock_and_movement_records_delta(): void
    {
        $admin = $this->admin();
        $product = Product::factory()->create(['stock_quantity' => 10]);
        $this->actingAs($admin)->postJson("/api/admin/stock/products/{$product->id}/adjust", ['quantity' => 4, 'reason' => 'Cycle count'])->assertOk()->assertJsonPath('data.stock_quantity', 4);
        $this->assertDatabaseHas('stock_movements', ['product_id' => $product->id, 'type' => 'manual_adjustment', 'quantity_before' => 10, 'quantity_changed' => -6, 'quantity_after' => 4, 'created_by_id' => $admin->id]);
        $auditLog = AuditLog::query()->where('event', 'stock.adjusted')->sole();
        $this->assertSame($admin->id, $auditLog->user_id);
        $this->assertSame('stock', $auditLog->module);
        $this->assertSame('adjusted', $auditLog->action);
        $this->assertSame(['stock_quantity' => 10], $auditLog->old_values);
        $this->assertSame(['stock_quantity' => 4], $auditLog->new_values);
    }

    public function test_adjustment_validation_rejects_missing_or_negative_quantity(): void
    {
        $admin = $this->admin();
        $product = Product::factory()->create();
        $this->actingAs($admin)->postJson("/api/admin/stock/products/{$product->id}/adjust", [])->assertUnprocessable()->assertJsonValidationErrors('quantity');
        $this->actingAs($admin)->postJson("/api/admin/stock/products/{$product->id}/adjust", ['quantity' => -1])->assertUnprocessable()->assertJsonValidationErrors('quantity');
    }

    public function test_checkout_decreases_stock_and_creates_order_movement(): void
    {
        [$user, $product] = $this->cartWithProduct(10, 3);
        $response = $this->actingAs($user)->postJson('/api/checkout', $this->checkoutPayload())->assertCreated();
        $this->assertSame(7, $product->refresh()->stock_quantity);
        $this->assertDatabaseHas('stock_movements', ['product_id' => $product->id, 'type' => 'order_placed', 'quantity_before' => 10, 'quantity_changed' => -3, 'quantity_after' => 7, 'reference_type' => 'order', 'reference_id' => $response->json('data.id')]);
    }

    public function test_checkout_fails_without_clearing_cart_when_stock_is_insufficient(): void
    {
        [$user, $product, $cart] = $this->cartWithProduct(2, 3);
        $this->actingAs($user)->postJson('/api/checkout', $this->checkoutPayload())->assertUnprocessable()->assertJsonValidationErrors('cart');
        $this->assertSame(2, $product->refresh()->stock_quantity);
        $this->assertDatabaseHas('cart_items', ['cart_id' => $cart->id, 'product_id' => $product->id]);
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('stock_movements', 0);
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function cartWithProduct(int $stock, int $quantity): array
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock_quantity' => $stock, 'price' => 20]);
        $cart = $user->cart()->create();
        $cart->items()->create(['product_id' => $product->id, 'quantity' => $quantity, 'unit_price' => '20.00', 'line_total' => number_format(20 * $quantity, 2, '.', '')]);

        return [$user, $product, $cart];
    }

    private function checkoutPayload(): array
    {
        return ['customer_name' => 'Stock Customer', 'customer_email' => 'stock@example.test', 'shipping_address_line1' => 'Main 1', 'shipping_city' => 'Berlin', 'shipping_postal_code' => '10115', 'shipping_country' => 'Germany', 'billing_same_as_shipping' => true, 'payment_method' => 'cash_on_delivery'];
    }
}
