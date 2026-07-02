<?php

namespace Tests\Feature\ProductReview;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductReviewApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_create_a_review(): void
    {
        $product = Product::factory()->create();

        $this->postJson(
            "/api/storefront/products/{$product->slug}/reviews",
            $this->reviewPayload(),
        )->assertUnauthorized();
    }

    public function test_customer_cannot_review_a_product_they_did_not_purchase(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();

        $this->actingAs($user, 'web')
            ->postJson(
                "/api/storefront/products/{$product->slug}/reviews",
                $this->reviewPayload(),
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('product');

        $this->assertDatabaseCount('product_reviews', 0);
    }

    public function test_customer_can_create_a_pending_review_for_a_delivered_purchase(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();
        $orderItem = $this->createPurchasedOrderItem($user, $product);

        $this->actingAs($user, 'web')
            ->postJson(
                "/api/storefront/products/{$product->slug}/reviews",
                $this->reviewPayload(),
            )
            ->assertCreated()
            ->assertJsonPath('data.rating', 5)
            ->assertJsonPath('data.status', ProductReview::STATUS_PENDING)
            ->assertJsonPath('data.is_verified_purchase', true)
            ->assertJsonPath('data.customer.name', $user->name);

        $this->assertDatabaseHas('product_reviews', [
            'product_id' => $product->id,
            'user_id' => $user->id,
            'order_item_id' => $orderItem->id,
            'status' => ProductReview::STATUS_PENDING,
            'is_verified_purchase' => true,
        ]);
    }

    public function test_customer_cannot_create_a_duplicate_active_review(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();
        $this->createPurchasedOrderItem($user, $product);
        ProductReview::factory()->for($user)->for($product)->create();

        $this->actingAs($user, 'web')
            ->postJson(
                "/api/storefront/products/{$product->slug}/reviews",
                $this->reviewPayload(),
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('product')
            ->assertJsonPath(
                'errors.product.0',
                'You have already reviewed this product.',
            );

        $this->assertDatabaseCount('product_reviews', 1);
    }

    public function test_approved_reviews_are_visible_publicly(): void
    {
        $product = Product::factory()->create();
        $review = ProductReview::factory()->approved()->for($product)->create([
            'title' => 'Excellent quality',
            'comment' => 'The build quality exceeded my expectations.',
        ]);

        $this->getJson("/api/storefront/products/{$product->slug}/reviews")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $review->id)
            ->assertJsonPath('data.0.title', 'Excellent quality')
            ->assertJsonMissingPath('data.0.status')
            ->assertJsonPath('summary.review_count', 1);
    }

    public function test_pending_and_rejected_reviews_are_not_visible_publicly(): void
    {
        $product = Product::factory()->create();
        ProductReview::factory()->for($product)->create();
        ProductReview::factory()->rejected()->for($product)->create();
        $approved = ProductReview::factory()->approved()->for($product)->create();

        $this->getJson("/api/storefront/products/{$product->slug}/reviews")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $approved->id)
            ->assertJsonPath('summary.review_count', 1);
    }

    public function test_customer_can_update_own_review_and_status_resets_to_pending(): void
    {
        $user = User::factory()->create();
        $review = ProductReview::factory()->approved()->for($user)->create([
            'moderated_by_id' => User::factory(),
            'moderation_note' => 'Previously approved.',
        ]);

        $this->actingAs($user, 'web')
            ->patchJson("/api/account/reviews/{$review->id}", [
                'rating' => 4,
                'title' => 'Updated review',
                'comment' => 'This updated review still has enough detail.',
            ])
            ->assertOk()
            ->assertJsonPath('data.rating', 4)
            ->assertJsonPath('data.status', ProductReview::STATUS_PENDING)
            ->assertJsonPath('data.moderation_note', null);

        $review->refresh();

        $this->assertSame(ProductReview::STATUS_PENDING, $review->status);
        $this->assertNull($review->approved_at);
        $this->assertNull($review->rejected_at);
        $this->assertNull($review->moderated_by_id);
    }

    public function test_customer_cannot_update_or_delete_another_customers_review(): void
    {
        $owner = User::factory()->create();
        $otherCustomer = User::factory()->create();
        $review = ProductReview::factory()->for($owner)->create();

        $this->actingAs($otherCustomer, 'web')
            ->patchJson("/api/account/reviews/{$review->id}", [
                'comment' => 'This update must never be accepted.',
            ])
            ->assertNotFound();

        $this->actingAs($otherCustomer, 'web')
            ->deleteJson("/api/account/reviews/{$review->id}")
            ->assertNotFound();

        $this->assertDatabaseHas('product_reviews', [
            'id' => $review->id,
            'deleted_at' => null,
        ]);
    }

    public function test_admin_can_list_reviews(): void
    {
        $admin = $this->adminUser();
        ProductReview::factory()->count(2)->create();

        $this->actingAs($admin, 'web')
            ->getJson('/api/admin/product-reviews')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 2)
            ->assertJsonStructure([
                'data' => [[
                    'id',
                    'rating',
                    'status',
                    'customer',
                    'product',
                ]],
            ]);
    }

    public function test_admin_can_approve_a_review(): void
    {
        $admin = $this->adminUser();
        $review = ProductReview::factory()->create();

        $this->actingAs($admin, 'web')
            ->patchJson("/api/admin/product-reviews/{$review->id}/moderate", [
                'status' => ProductReview::STATUS_APPROVED,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', ProductReview::STATUS_APPROVED)
            ->assertJsonPath('data.moderator.id', $admin->id);

        $review->refresh();

        $this->assertNotNull($review->approved_at);
        $this->assertNull($review->rejected_at);
        $this->assertSame($admin->id, $review->moderated_by_id);
    }

    public function test_admin_can_reject_a_review_with_a_moderation_note(): void
    {
        $admin = $this->adminUser();
        $review = ProductReview::factory()->create();

        $this->actingAs($admin, 'web')
            ->patchJson("/api/admin/product-reviews/{$review->id}/moderate", [
                'status' => ProductReview::STATUS_REJECTED,
                'moderation_note' => 'The content does not meet review guidelines.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', ProductReview::STATUS_REJECTED)
            ->assertJsonPath(
                'data.moderation_note',
                'The content does not meet review guidelines.',
            );

        $review->refresh();

        $this->assertNotNull($review->rejected_at);
        $this->assertNull($review->approved_at);
    }

    public function test_non_admin_cannot_access_admin_review_routes(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $review = ProductReview::factory()->create();

        $this->actingAs($customer, 'web')
            ->getJson('/api/admin/product-reviews')
            ->assertForbidden();

        $this->actingAs($customer, 'web')
            ->getJson("/api/admin/product-reviews/{$review->id}")
            ->assertForbidden();

        $this->actingAs($customer, 'web')
            ->patchJson("/api/admin/product-reviews/{$review->id}/moderate", [
                'status' => ProductReview::STATUS_APPROVED,
            ])
            ->assertForbidden();
    }

    public function test_storefront_product_details_include_approved_rating_summary(): void
    {
        $product = Product::factory()->create();
        ProductReview::factory()->approved()->for($product)->create(['rating' => 5]);
        ProductReview::factory()->approved()->for($product)->create(['rating' => 3]);
        ProductReview::factory()->for($product)->create(['rating' => 1]);

        $response = $this->getJson("/api/storefront/products/{$product->slug}");

        $response
            ->assertOk()
            ->assertJsonPath('data.rating_summary.average_rating', 4)
            ->assertJsonPath('data.rating_summary.review_count', 2)
            ->assertJsonPath('data.rating_summary.rating_breakdown.0.rating', 5)
            ->assertJsonPath('data.rating_summary.rating_breakdown.0.count', 1)
            ->assertJsonPath('data.rating_summary.rating_breakdown.1.rating', 4)
            ->assertJsonPath('data.rating_summary.rating_breakdown.1.count', 0)
            ->assertJsonPath('data.rating_summary.rating_breakdown.2.rating', 3)
            ->assertJsonPath('data.rating_summary.rating_breakdown.2.count', 1)
            ->assertJsonPath('data.rating_summary.rating_breakdown.4.rating', 1)
            ->assertJsonPath('data.rating_summary.rating_breakdown.4.count', 0);
    }

    /**
     * @return array<string, mixed>
     */
    private function reviewPayload(): array
    {
        return [
            'rating' => 5,
            'title' => 'A strong purchase',
            'comment' => 'This product delivered everything I expected from it.',
        ];
    }

    private function createPurchasedOrderItem(
        User $user,
        Product $product,
    ): OrderItem {
        $order = Order::factory()->for($user)->create([
            'status' => 'delivered',
        ]);

        return OrderItem::factory()->for($order)->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
        ]);
    }

    private function adminUser(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }
}
