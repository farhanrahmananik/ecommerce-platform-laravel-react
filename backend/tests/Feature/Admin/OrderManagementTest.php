<?php

namespace Tests\Feature\Admin;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_unauthenticated_user_cannot_access_the_admin_orders_index(): void
    {
        $this->getJson('/api/admin/orders')->assertUnauthorized();
    }

    public function test_an_admin_capable_user_can_list_orders(): void
    {
        $admin = $this->adminUser();
        $olderOrder = Order::factory()->create([
            'order_number' => 'ORD-ADMIN-OLDER',
            'created_at' => now()->subDay(),
        ]);
        $latestOrder = Order::factory()->create([
            'order_number' => 'ORD-ADMIN-LATEST',
            'created_at' => now(),
        ]);

        $this
            ->actingAs($admin, 'web')
            ->getJson('/api/admin/orders')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $latestOrder->id)
            ->assertJsonPath('data.1.id', $olderOrder->id)
            ->assertJsonPath('meta.total', 2);
    }

    public function test_admin_order_list_includes_customer_summary(): void
    {
        $admin = $this->adminUser();
        $customer = User::factory()->create([
            'name' => 'Customer One',
            'email' => 'customer@example.test',
        ]);
        Order::factory()->for($customer)->create();

        $this
            ->actingAs($admin, 'web')
            ->getJson('/api/admin/orders')
            ->assertOk()
            ->assertJsonPath('data.0.customer.id', $customer->id)
            ->assertJsonPath('data.0.customer.name', 'Customer One')
            ->assertJsonPath('data.0.customer.email', 'customer@example.test');
    }

    public function test_admin_can_filter_orders_by_status(): void
    {
        $admin = $this->adminUser();
        $processingOrder = Order::factory()->create(['status' => 'processing']);
        Order::factory()->create(['status' => 'pending']);

        $this
            ->actingAs($admin, 'web')
            ->getJson('/api/admin/orders?status=processing')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $processingOrder->id)
            ->assertJsonPath('data.0.status', 'processing');
    }

    public function test_admin_can_search_orders_by_number_or_customer_email_or_name(): void
    {
        $admin = $this->adminUser();
        $order = Order::factory()->create([
            'order_number' => 'ORD-SEARCH-2026',
            'customer_name' => 'Searchable Customer',
            'customer_email' => 'lookup@example.test',
        ]);
        Order::factory()->create([
            'order_number' => 'ORD-NOISE-2026',
            'customer_name' => 'Different Customer',
            'customer_email' => 'different@example.test',
        ]);

        foreach (['SEARCH-2026', 'lookup@example.test', 'Searchable'] as $search) {
            $this
                ->actingAs($admin, 'web')
                ->getJson('/api/admin/orders?search='.urlencode($search))
                ->assertOk()
                ->assertJsonCount(1, 'data')
                ->assertJsonPath('data.0.id', $order->id);
        }
    }

    public function test_admin_can_view_order_details(): void
    {
        $admin = $this->adminUser();
        $order = Order::factory()->create([
            'order_number' => 'ORD-ADMIN-DETAIL',
            'status' => 'pending',
            'total' => '245.50',
        ]);

        $this
            ->actingAs($admin, 'web')
            ->getJson("/api/admin/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $order->id)
            ->assertJsonPath('data.order_number', 'ORD-ADMIN-DETAIL')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.total', '245.50')
            ->assertJsonPath(
                'data.shipping_address.line1',
                $order->shipping_address_line1,
            );
    }

    public function test_admin_order_details_include_order_items(): void
    {
        $admin = $this->adminUser();
        $product = Product::factory()->create([
            'name' => 'Admin Order Product',
            'slug' => 'admin-order-product',
            'sku' => 'ADMIN-ORDER-001',
        ]);
        $order = Order::factory()->create();
        $item = OrderItem::factory()->for($order)->create([
            'product_id' => $product->id,
            'product_name' => 'Admin Order Product',
            'quantity' => 2,
            'unit_price' => '35.00',
            'line_total' => '70.00',
        ]);

        $this
            ->actingAs($admin, 'web')
            ->getJson("/api/admin/orders/{$order->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.id', $item->id)
            ->assertJsonPath('data.items.0.product_slug', 'admin-order-product')
            ->assertJsonPath('data.items.0.quantity', 2)
            ->assertJsonPath('data.items.0.total', '70.00')
            ->assertJsonPath('data.items.0.product.id', $product->id);
    }

    public function test_admin_can_update_order_status_using_a_valid_transition(): void
    {
        $admin = $this->adminUser();
        $order = Order::factory()->create(['status' => 'pending']);

        $this
            ->actingAs($admin, 'web')
            ->patchJson("/api/admin/orders/{$order->id}/status", [
                'status' => 'processing',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'processing');

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'processing',
            'payment_status' => 'pending',
        ]);
    }

    public function test_same_status_update_is_allowed_as_a_no_op(): void
    {
        $admin = $this->adminUser();
        $order = Order::factory()->create(['status' => 'processing']);

        $this
            ->actingAs($admin, 'web')
            ->patchJson("/api/admin/orders/{$order->id}/status", [
                'status' => 'processing',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'processing');

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'processing',
        ]);
    }

    public function test_invalid_status_transition_is_rejected(): void
    {
        $admin = $this->adminUser();
        $order = Order::factory()->create(['status' => 'pending']);

        $this
            ->actingAs($admin, 'web')
            ->patchJson("/api/admin/orders/{$order->id}/status", [
                'status' => 'delivered',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status'])
            ->assertJsonPath(
                'errors.status.0',
                'An order cannot transition from pending to delivered.',
            );

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'pending',
        ]);
    }

    public function test_terminal_delivered_order_cannot_be_changed(): void
    {
        $admin = $this->adminUser();
        $order = Order::factory()->create(['status' => 'delivered']);

        $this
            ->actingAs($admin, 'web')
            ->patchJson("/api/admin/orders/{$order->id}/status", [
                'status' => 'cancelled',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'delivered',
        ]);
    }

    public function test_terminal_cancelled_order_cannot_be_changed(): void
    {
        $admin = $this->adminUser();
        $order = Order::factory()->create(['status' => 'cancelled']);

        $this
            ->actingAs($admin, 'web')
            ->patchJson("/api/admin/orders/{$order->id}/status", [
                'status' => 'processing',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'cancelled',
        ]);
    }

    private function adminUser(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }
}
