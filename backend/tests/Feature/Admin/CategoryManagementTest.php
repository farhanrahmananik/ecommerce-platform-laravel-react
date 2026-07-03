<?php

namespace Tests\Feature\Admin;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_unauthenticated_user_cannot_access_the_category_index(): void
    {
        $this->getJson('/api/admin/categories')->assertUnauthorized();
    }

    public function test_an_authenticated_user_can_list_categories(): void
    {
        $user = User::factory()->create();

        Category::query()->create([
            'name' => 'Accessories',
            'slug' => 'accessories',
            'sort_order' => 2,
        ]);
        Category::query()->create([
            'name' => 'Apparel',
            'slug' => 'apparel',
            'sort_order' => 1,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson('/api/admin/categories');

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'Apparel')
            ->assertJsonPath('data.1.name', 'Accessories');
    }

    public function test_an_authenticated_user_can_create_a_category(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user, 'web')
            ->postJson('/api/admin/categories', [
                'name' => 'Home & Living',
                'slug' => 'home-and-living',
                'description' => 'Products for every room.',
                'is_active' => true,
                'sort_order' => 3,
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Home & Living')
            ->assertJsonPath('data.slug', 'home-and-living')
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('data.sort_order', 3);

        $this->assertDatabaseHas('categories', [
            'name' => 'Home & Living',
            'slug' => 'home-and-living',
        ]);

        $auditLog = AuditLog::query()->where('event', 'category.created')->sole();

        $this->assertSame($user->id, $auditLog->user_id);
        $this->assertSame('categories', $auditLog->module);
        $this->assertSame('created', $auditLog->action);
        $this->assertSame($response->json('data.id'), $auditLog->auditable_id);
        $this->assertSame('Home & Living', $auditLog->new_values['name']);
    }

    public function test_a_unique_slug_is_generated_when_it_is_missing(): void
    {
        $user = User::factory()->create();

        Category::query()->create([
            'name' => 'Summer Sale',
            'slug' => 'summer-sale',
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->postJson('/api/admin/categories', [
                'name' => 'Summer Sale',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.slug', 'summer-sale-2');

        $this->assertDatabaseHas('categories', ['slug' => 'summer-sale-2']);
    }

    public function test_validation_errors_are_returned_for_invalid_category_data(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user, 'web')
            ->postJson('/api/admin/categories', [
                'name' => '',
                'parent_id' => 9999,
                'is_active' => 'not-a-boolean',
                'sort_order' => -1,
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name',
                'parent_id',
                'is_active',
                'sort_order',
            ]);

        $this->assertDatabaseCount('audit_logs', 0);
    }

    public function test_an_authenticated_user_can_update_a_category(): void
    {
        $user = User::factory()->create();
        $category = Category::query()->create([
            'name' => 'Old Name',
            'slug' => 'old-name',
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->patchJson("/api/admin/categories/{$category->id}", [
                'name' => 'New Name',
                'description' => 'Updated description.',
                'is_active' => false,
                'sort_order' => 5,
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.name', 'New Name')
            ->assertJsonPath('data.slug', 'new-name')
            ->assertJsonPath('data.is_active', false)
            ->assertJsonPath('data.sort_order', 5);

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'New Name',
            'slug' => 'new-name',
            'is_active' => false,
        ]);
    }

    public function test_a_category_cannot_be_its_own_parent(): void
    {
        $user = User::factory()->create();
        $category = Category::query()->create([
            'name' => 'Electronics',
            'slug' => 'electronics',
        ]);

        $this
            ->actingAs($user, 'web')
            ->patchJson("/api/admin/categories/{$category->id}", [
                'parent_id' => $category->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['parent_id']);
    }

    public function test_an_authenticated_user_can_delete_a_category(): void
    {
        $user = User::factory()->create();
        $category = Category::query()->create([
            'name' => 'Archive Me',
            'slug' => 'archive-me',
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->deleteJson("/api/admin/categories/{$category->id}");

        $response
            ->assertOk()
            ->assertExactJson([
                'message' => 'Category deleted successfully.',
            ]);

        $this->assertSoftDeleted($category);
    }
}
