<?php

namespace Tests\Feature\Admin;

use App\Models\AuditLog;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportsApiTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    public function test_unauthenticated_user_cannot_access_admin_reports(): void
    {
        $this->getJson('/api/admin/reports/summary')->assertUnauthorized();
    }

    public function test_customer_cannot_access_admin_reports(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'customer']))->getJson('/api/admin/reports/summary')->assertForbidden();
    }

    public function test_admin_can_view_report_summary(): void
    {
        $a = $this->admin();
        Order::factory()->create(['subtotal' => 100, 'total' => 90, 'status' => 'delivered']);
        $this->actingAs($a)->getJson('/api/admin/reports/summary')->assertOk()->assertJsonPath('data.total_orders', 1)->assertJsonPath('data.completed_orders', 1)->assertJsonPath('data.net_sales', 90);
        $this->assertSame(0, AuditLog::query()->count());
    }

    public function test_admin_can_view_sales_report(): void
    {
        $a = $this->admin();
        Order::factory()->create(['subtotal' => 100, 'total' => 80]);
        $this->actingAs($a)->getJson('/api/admin/reports/sales')->assertOk()->assertJsonPath('data.0.orders_count', 1);
    }

    public function test_admin_can_view_top_products_report(): void
    {
        $a = $this->admin();
        $p = Product::factory()->create();
        $o = Order::factory()->create();
        OrderItem::factory()->for($o)->create(['product_id' => $p->id, 'product_name' => $p->name, 'quantity' => 3, 'line_total' => 60]);
        $this->actingAs($a)->getJson('/api/admin/reports/top-products')->assertOk()->assertJsonPath('data.0.id', $p->id)->assertJsonPath('data.0.total_quantity_sold', 3);
    }

    public function test_admin_can_view_stock_report(): void
    {
        $a = $this->admin();
        $p = Product::factory()->create(['stock_quantity' => 8]);
        $this->actingAs($a)->getJson('/api/admin/reports/stock')->assertOk()->assertJsonPath('data.0.id', $p->id)->assertJsonPath('data.0.stock_status', 'in_stock');
    }

    public function test_date_range_validation_works(): void
    {
        $this->actingAs($this->admin())->getJson('/api/admin/reports/summary?start_date=2026-07-10&end_date=2026-07-01')->assertUnprocessable()->assertJsonValidationErrors('end_date');
    }

    public function test_top_product_limit_validation_works(): void
    {
        $this->actingAs($this->admin())->getJson('/api/admin/reports/top-products?limit=51')->assertUnprocessable()->assertJsonValidationErrors('limit');
    }

    public function test_stock_status_filter_works(): void
    {
        $a = $this->admin();
        Product::factory()->create(['stock_quantity' => 0]);
        Product::factory()->create(['stock_quantity' => 20]);
        $this->actingAs($a)->getJson('/api/admin/reports/stock?status=out_of_stock')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.stock_status', 'out_of_stock');
    }
}
