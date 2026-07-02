<?php

namespace Tests\Feature\Coupon;

use App\Models\Coupon;
use App\Models\CouponRedemption;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CouponValidationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_validate_a_coupon(): void
    {
        $this->postJson('/api/coupons/validate', ['code' => 'SAVE20'])
            ->assertUnauthorized();
    }

    public function test_authenticated_user_can_validate_a_fixed_coupon(): void
    {
        $user = $this->userWithCart('100.00');
        Coupon::factory()->create([
            'code' => 'SAVE20',
            'type' => 'fixed',
            'value' => 20,
        ]);

        $this->actingAs($user, 'web')
            ->postJson('/api/coupons/validate', ['code' => 'save20'])
            ->assertOk()
            ->assertJsonPath('message', 'Coupon is valid.')
            ->assertJsonPath('data.code', 'SAVE20')
            ->assertJsonPath('data.type', 'fixed')
            ->assertJsonPath('data.discount_amount', '20.00')
            ->assertJsonPath('data.cart_subtotal', '100.00')
            ->assertJsonPath('data.total_after_discount', '80.00');
    }

    public function test_authenticated_user_can_validate_a_percentage_coupon(): void
    {
        $user = $this->userWithCart('150.00');
        Coupon::factory()->percentage()->create([
            'code' => 'SAVE10',
            'value' => 10,
            'max_discount_amount' => null,
        ]);

        $this->actingAs($user, 'web')
            ->postJson('/api/coupons/validate', ['code' => 'SAVE10'])
            ->assertOk()
            ->assertJsonPath('data.discount_amount', '15.00')
            ->assertJsonPath('data.total_after_discount', '135.00');
    }

    public function test_percentage_coupon_respects_maximum_discount_amount(): void
    {
        $user = $this->userWithCart('200.00');
        Coupon::factory()->percentage()->create([
            'code' => 'CAPPED',
            'value' => 50,
            'max_discount_amount' => 30,
        ]);

        $this->actingAs($user, 'web')
            ->postJson('/api/coupons/validate', ['code' => 'CAPPED'])
            ->assertOk()
            ->assertJsonPath('data.discount_amount', '30.00')
            ->assertJsonPath('data.total_after_discount', '170.00');
    }

    public function test_inactive_coupon_is_rejected(): void
    {
        $this->assertCouponIsRejected([
            'is_active' => false,
        ], 'This coupon is inactive.');
    }

    public function test_expired_coupon_is_rejected(): void
    {
        $this->assertCouponIsRejected([
            'expires_at' => now()->subMinute(),
        ], 'This coupon has expired.');
    }

    public function test_not_yet_started_coupon_is_rejected(): void
    {
        $this->assertCouponIsRejected([
            'starts_at' => now()->addMinute(),
        ], 'This coupon is not active yet.');
    }

    public function test_minimum_order_amount_is_enforced(): void
    {
        $this->assertCouponIsRejected([
            'min_order_amount' => 101,
        ], 'Your cart subtotal does not meet the minimum order amount for this coupon.');
    }

    public function test_global_usage_limit_is_enforced(): void
    {
        $this->assertCouponIsRejected([
            'usage_limit' => 1,
            'used_count' => 1,
        ], 'This coupon has reached its usage limit.');
    }

    public function test_per_user_usage_limit_is_enforced(): void
    {
        $user = $this->userWithCart('100.00');
        $coupon = Coupon::factory()->create([
            'code' => 'LIMITED',
            'usage_limit_per_user' => 1,
        ]);
        $order = Order::factory()->for($user)->create();

        CouponRedemption::factory()->create([
            'coupon_id' => $coupon->id,
            'user_id' => $user->id,
            'order_id' => $order->id,
            'coupon_code' => $coupon->code,
        ]);

        $this->actingAs($user, 'web')
            ->postJson('/api/coupons/validate', ['code' => 'LIMITED'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('code')
            ->assertJsonPath(
                'errors.code.0',
                'You have reached the usage limit for this coupon.',
            );
    }

    public function test_empty_cart_cannot_validate_a_coupon(): void
    {
        $user = User::factory()->create();
        Coupon::factory()->create(['code' => 'SAVE20']);

        $this->actingAs($user, 'web')
            ->postJson('/api/coupons/validate', ['code' => 'SAVE20'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('cart')
            ->assertJsonPath('errors.cart.0', 'Your cart is empty.');
    }

    /**
     * @param  array<string, mixed>  $couponOverrides
     */
    private function assertCouponIsRejected(
        array $couponOverrides,
        string $message,
    ): void {
        $user = $this->userWithCart('100.00');

        Coupon::factory()->create(array_merge([
            'code' => 'REJECTED',
        ], $couponOverrides));

        $this->actingAs($user, 'web')
            ->postJson('/api/coupons/validate', ['code' => 'REJECTED'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('code')
            ->assertJsonPath('errors.code.0', $message);
    }

    private function userWithCart(string $lineTotal): User
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();
        $cart = $user->cart()->create();

        $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => $lineTotal,
            'line_total' => $lineTotal,
        ]);

        return $user;
    }
}
