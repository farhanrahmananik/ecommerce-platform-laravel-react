<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardSummaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_unauthenticated_user_cannot_access_the_admin_summary(): void
    {
        $this->getJson('/api/admin/dashboard/summary')->assertUnauthorized();
    }

    public function test_an_authenticated_user_receives_a_defensive_dashboard_summary(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->create(['role' => 'customer']);

        $response = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/admin/dashboard/summary');

        $response
            ->assertOk()
            ->assertJsonPath('data.stats.0.label', 'Customers')
            ->assertJsonPath('data.stats.0.value', 2)
            ->assertJsonPath('data.stats.1.label', 'Products')
            ->assertJsonPath('data.stats.1.value', 0)
            ->assertJsonPath('data.stats.2.value', 0)
            ->assertJsonPath('data.stats.3.value', 0)
            ->assertJsonPath('data.quick_actions.0.path', '/admin/categories')
            ->assertJsonPath('data.recent_activity', [])
            ->assertJsonPath('data.system.api_status', 'Online')
            ->assertJsonPath('data.system.environment', 'testing');
    }
}
