<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAuthorizationRegressionTest extends TestCase
{
    use RefreshDatabase;

    /** @var list<string> */
    private const REPRESENTATIVE_ADMIN_ENDPOINTS = [
        '/api/admin/dashboard/summary',
        '/api/admin/orders',
        '/api/admin/categories',
        '/api/admin/products',
        '/api/admin/coupons',
    ];

    public function test_unauthenticated_users_cannot_access_admin_endpoints(): void
    {
        foreach (self::REPRESENTATIVE_ADMIN_ENDPOINTS as $endpoint) {
            $this->getJson($endpoint)->assertUnauthorized();
        }

        $this->postJson('/api/admin/categories', [
            'name' => 'Unauthorized Category',
        ])->assertUnauthorized();
    }

    public function test_customers_cannot_access_admin_endpoints(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        foreach (self::REPRESENTATIVE_ADMIN_ENDPOINTS as $endpoint) {
            $this->actingAs($customer, 'web')
                ->getJson($endpoint)
                ->assertForbidden();
        }

        $this->actingAs($customer, 'web')
            ->postJson('/api/admin/categories', [])
            ->assertForbidden();
    }

    public function test_admin_roles_can_access_admin_endpoints(): void
    {
        foreach (['admin', 'store_manager', 'super_admin'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            foreach (self::REPRESENTATIVE_ADMIN_ENDPOINTS as $endpoint) {
                $this->actingAs($user, 'web')
                    ->getJson($endpoint)
                    ->assertOk();
            }

            $this->actingAs($user, 'web')
                ->postJson('/api/admin/categories', [])
                ->assertUnprocessable()
                ->assertJsonValidationErrors('name');
        }
    }
}
