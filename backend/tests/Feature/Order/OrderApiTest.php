<?php

namespace Tests\Feature\Order;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_unauthenticated_user_cannot_access_the_orders_index(): void
    {
        $this->getJson('/api/orders')->assertUnauthorized();
    }

    public function test_an_authenticated_user_can_list_own_orders(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $olderOrder = Order::factory()->for($user)->create([
            'order_number' => 'ORD-OWN-OLDER',
            'created_at' => now()->subDay(),
        ]);
        $latestOrder = Order::factory()->for($user)->create([
            'order_number' => 'ORD-OWN-LATEST',
            'created_at' => now(),
        ]);
        Order::factory()->for($otherUser)->create([
            'order_number' => 'ORD-OTHER',
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson('/api/orders');

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $latestOrder->id)
            ->assertJsonPath('data.1.id', $olderOrder->id)
            ->assertJsonPath('meta.total', 2);

        $this->assertNotContains(
            'ORD-OTHER',
            $response->json('data.*.order_number'),
        );
    }

    public function test_an_authenticated_user_can_view_own_order_details(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->for($user)->create([
            'order_number' => 'ORD-CUSTOMER-DETAIL',
            'status' => 'pending',
            'total' => '149.95',
        ]);

        $this
            ->actingAs($user, 'web')
            ->getJson("/api/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $order->id)
            ->assertJsonPath('data.order_number', 'ORD-CUSTOMER-DETAIL')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.total', '149.95')
            ->assertJsonPath(
                'data.shipping_address.line1',
                $order->shipping_address_line1,
            );
    }

    public function test_an_authenticated_user_cannot_view_another_users_order(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $order = Order::factory()->for($owner)->create();

        $this
            ->actingAs($otherUser, 'web')
            ->getJson("/api/orders/{$order->id}")
            ->assertNotFound();
    }

    public function test_order_details_include_order_items(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->for($user)->create();
        $firstItem = OrderItem::factory()->for($order)->create([
            'product_name' => 'Canvas Backpack',
            'product_sku' => 'BAG-001',
            'unit_price' => '49.95',
            'quantity' => 2,
            'line_total' => '99.90',
        ]);
        OrderItem::factory()->for($order)->create([
            'product_name' => 'Travel Wallet',
        ]);

        $this
            ->actingAs($user, 'web')
            ->getJson("/api/orders/{$order->id}")
            ->assertOk()
            ->assertJsonCount(2, 'data.items')
            ->assertJsonPath('data.items.0.id', $firstItem->id)
            ->assertJsonPath('data.items.0.product_name', 'Canvas Backpack')
            ->assertJsonPath('data.items.0.product_sku', 'BAG-001')
            ->assertJsonPath('data.items.0.quantity', 2)
            ->assertJsonPath('data.items.0.unit_price', '49.95')
            ->assertJsonPath('data.items.0.line_total', '99.90')
            ->assertJsonPath('data.items.0.total', '99.90');
    }
}
