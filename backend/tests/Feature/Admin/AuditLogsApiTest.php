<?php

namespace Tests\Feature\Admin;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogsApiTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    public function test_unauthenticated_user_cannot_access_audit_logs_index(): void
    {
        $this->getJson('/api/admin/audit-logs')->assertUnauthorized();
    }

    public function test_customer_cannot_access_audit_logs_index(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'customer']))->getJson('/api/admin/audit-logs')->assertForbidden();
    }

    public function test_admin_can_list_audit_logs(): void
    {
        $a = $this->admin();
        AuditLog::factory()->count(2)->create();
        $this->actingAs($a)->getJson('/api/admin/audit-logs')->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('meta.total', 2);
    }

    public function test_admin_can_filter_audit_logs(): void
    {
        $a = $this->admin();
        $u = User::factory()->create(['name' => 'Filter User']);
        AuditLog::factory()->create(['user_id' => $u->id, 'module' => 'orders', 'action' => 'update', 'event' => 'status_changed', 'description' => 'Special audit needle', 'created_at' => now()]);
        AuditLog::factory()->create(['module' => 'products', 'action' => 'create', 'event' => 'created', 'created_at' => now()->subDays(10)]);
        foreach (['module=orders', 'action=update', 'event=status_changed', 'search=needle', 'search=Filter', 'date_from='.now()->subDay()->toDateString(), 'date_to='.now()->subDays(5)->toDateString()] as $query) {
            $this->actingAs($a)->getJson('/api/admin/audit-logs?'.$query)->assertOk()->assertJsonCount(1, 'data');
        }
    }

    public function test_admin_can_view_a_single_audit_log(): void
    {
        $a = $this->admin();
        $log = AuditLog::factory()->create(['description' => 'Viewed log']);
        $this->actingAs($a)->getJson("/api/admin/audit-logs/{$log->id}")->assertOk()->assertJsonPath('data.id', $log->id)->assertJsonPath('data.description', 'Viewed log');
    }

    public function test_resource_includes_user_data(): void
    {
        $a = $this->admin();
        $u = User::factory()->create(['name' => 'Audit Admin', 'email' => 'audit@example.test', 'role' => 'store_manager']);
        $log = AuditLog::factory()->create(['user_id' => $u->id]);
        $this->actingAs($a)->getJson("/api/admin/audit-logs/{$log->id}")->assertOk()->assertJsonPath('data.user.id', $u->id)->assertJsonPath('data.user.name', 'Audit Admin')->assertJsonPath('data.user.email', 'audit@example.test')->assertJsonPath('data.user.role', 'store_manager');
    }
}
