<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductReview;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductReview>
 */
class ProductReviewFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'user_id' => User::factory(),
            'order_item_id' => null,
            'rating' => fake()->numberBetween(1, 5),
            'title' => fake()->optional()->sentence(4),
            'comment' => fake()->paragraph(),
            'status' => ProductReview::STATUS_PENDING,
            'is_verified_purchase' => true,
            'reviewed_at' => now(),
            'approved_at' => null,
            'rejected_at' => null,
            'moderated_by_id' => null,
            'moderation_note' => null,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (): array => [
            'status' => ProductReview::STATUS_APPROVED,
            'approved_at' => now(),
            'rejected_at' => null,
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (): array => [
            'status' => ProductReview::STATUS_REJECTED,
            'approved_at' => null,
            'rejected_at' => now(),
        ]);
    }
}
