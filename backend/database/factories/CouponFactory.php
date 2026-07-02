<?php

namespace Database\Factories;

use App\Models\Coupon;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Coupon>
 */
class CouponFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->bothify('SAVE-####-??')),
            'name' => fake()->words(3, true),
            'description' => fake()->optional()->sentence(),
            'type' => 'fixed',
            'value' => fake()->randomFloat(2, 5, 50),
            'max_discount_amount' => null,
            'min_order_amount' => 0,
            'usage_limit' => null,
            'usage_limit_per_user' => null,
            'used_count' => 0,
            'starts_at' => null,
            'expires_at' => null,
            'is_active' => true,
            'created_by_id' => User::factory(),
        ];
    }

    public function percentage(): static
    {
        return $this->state(fn (): array => [
            'type' => 'percentage',
            'value' => fake()->randomFloat(2, 5, 50),
            'max_discount_amount' => fake()->randomFloat(2, 20, 100),
        ]);
    }
}
