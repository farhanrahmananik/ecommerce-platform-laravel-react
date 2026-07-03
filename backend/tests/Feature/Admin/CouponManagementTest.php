<?php

namespace Tests\Feature\Admin;

use App\Models\AuditLog;
use App\Models\Coupon;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CouponManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_coupon_index(): void
    {
        $this->getJson('/api/admin/coupons')
            ->assertUnauthorized();
    }

    public function test_authenticated_admin_can_list_coupons(): void
    {
        $admin = $this->adminUser();

        Coupon::factory()->count(2)->create([
            'created_by_id' => $admin->id,
        ]);

        $this->actingAs($admin)
            ->getJson('/api/admin/coupons')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure([
                'data' => [[
                    'id',
                    'code',
                    'name',
                    'type',
                    'value',
                    'is_active',
                    'created_by',
                    'redemptions_count',
                ]],
                'links',
                'meta',
            ]);
    }

    public function test_authenticated_admin_can_create_a_fixed_coupon(): void
    {
        $admin = $this->adminUser();

        $response = $this->actingAs($admin)
            ->postJson('/api/admin/coupons', $this->couponPayload());

        $response
            ->assertCreated()
            ->assertJsonPath('data.code', 'SAVE20')
            ->assertJsonPath('data.type', 'fixed')
            ->assertJsonPath('data.created_by.id', $admin->id);

        $this->assertDatabaseHas('coupons', [
            'code' => 'SAVE20',
            'type' => 'fixed',
            'created_by_id' => $admin->id,
        ]);
    }

    public function test_authenticated_admin_can_create_a_percentage_coupon(): void
    {
        $admin = $this->adminUser();

        $this->actingAs($admin)
            ->postJson('/api/admin/coupons', $this->couponPayload([
                'code' => 'summer15',
                'name' => 'Summer 15 percent',
                'type' => 'percentage',
                'value' => 15,
                'max_discount_amount' => 50,
            ]))
            ->assertCreated()
            ->assertJsonPath('data.code', 'SUMMER15')
            ->assertJsonPath('data.type', 'percentage');

        $this->assertDatabaseHas('coupons', [
            'code' => 'SUMMER15',
            'type' => 'percentage',
        ]);
    }

    public function test_coupon_code_is_normalized_to_uppercase(): void
    {
        $admin = $this->adminUser();

        $this->actingAs($admin)
            ->postJson('/api/admin/coupons', $this->couponPayload([
                'code' => '  welcome10  ',
            ]))
            ->assertCreated()
            ->assertJsonPath('data.code', 'WELCOME10');
    }

    public function test_duplicate_coupon_code_is_rejected(): void
    {
        $admin = $this->adminUser();

        Coupon::factory()->create([
            'code' => 'SAVE20',
            'created_by_id' => $admin->id,
        ]);

        $this->actingAs($admin)
            ->postJson('/api/admin/coupons', $this->couponPayload([
                'code' => 'save20',
            ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('code');
    }

    public function test_percentage_coupon_value_cannot_exceed_one_hundred(): void
    {
        $admin = $this->adminUser();

        $this->actingAs($admin)
            ->postJson('/api/admin/coupons', $this->couponPayload([
                'type' => 'percentage',
                'value' => 101,
            ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('value');
    }

    public function test_authenticated_admin_can_update_a_coupon(): void
    {
        $admin = $this->adminUser();
        $coupon = Coupon::factory()->create([
            'created_by_id' => $admin->id,
        ]);

        $this->actingAs($admin)
            ->patchJson("/api/admin/coupons/{$coupon->id}", [
                'code' => 'vip25',
                'name' => 'VIP discount',
                'type' => 'percentage',
                'value' => 25,
                'is_active' => false,
            ])
            ->assertOk()
            ->assertJsonPath('data.code', 'VIP25')
            ->assertJsonPath('data.name', 'VIP discount')
            ->assertJsonPath('data.is_active', false);

        $this->assertDatabaseHas('coupons', [
            'id' => $coupon->id,
            'code' => 'VIP25',
            'type' => 'percentage',
            'is_active' => false,
        ]);
    }

    public function test_authenticated_admin_can_soft_delete_a_coupon(): void
    {
        $admin = $this->adminUser();
        $coupon = Coupon::factory()->create([
            'created_by_id' => $admin->id,
        ]);

        $this->actingAs($admin)
            ->deleteJson("/api/admin/coupons/{$coupon->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Coupon deleted successfully.');

        $this->assertSoftDeleted($coupon);

        $auditLog = AuditLog::query()->where('event', 'coupon.deleted')->sole();

        $this->assertSame($admin->id, $auditLog->user_id);
        $this->assertSame('coupons', $auditLog->module);
        $this->assertSame('deleted', $auditLog->action);
        $this->assertSame($coupon->id, $auditLog->auditable_id);
        $this->assertSame($coupon->code, $auditLog->old_values['code']);
    }

    private function adminUser(): User
    {
        return User::factory()->create([
            'role' => 'admin',
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function couponPayload(array $overrides = []): array
    {
        return array_merge([
            'code' => 'SAVE20',
            'name' => 'Save twenty',
            'description' => 'Save on qualifying orders.',
            'type' => 'fixed',
            'value' => 20,
            'max_discount_amount' => null,
            'min_order_amount' => 100,
            'usage_limit' => 500,
            'usage_limit_per_user' => 1,
            'starts_at' => now()->addDay()->toIso8601String(),
            'expires_at' => now()->addMonth()->toIso8601String(),
            'is_active' => true,
        ], $overrides);
    }
}
