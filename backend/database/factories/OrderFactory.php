<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 20, 500);

        return [
            'order_number' => sprintf(
                'ORD-%s-%s',
                now()->format('Ymd'),
                strtoupper(fake()->unique()->bothify('??####')),
            ),
            'user_id' => User::factory(),
            'customer_name' => fake()->name(),
            'customer_email' => fake()->safeEmail(),
            'customer_phone' => fake()->phoneNumber(),
            'shipping_address_line1' => fake()->streetAddress(),
            'shipping_address_line2' => null,
            'shipping_city' => fake()->city(),
            'shipping_state' => fake()->state(),
            'shipping_postal_code' => fake()->postcode(),
            'shipping_country' => fake()->country(),
            'billing_same_as_shipping' => true,
            'billing_address_line1' => fake()->streetAddress(),
            'billing_address_line2' => null,
            'billing_city' => fake()->city(),
            'billing_state' => fake()->state(),
            'billing_postal_code' => fake()->postcode(),
            'billing_country' => fake()->country(),
            'subtotal' => $subtotal,
            'shipping_amount' => 0,
            'discount_amount' => 0,
            'tax_amount' => 0,
            'total' => $subtotal,
            'payment_method' => 'cash_on_delivery',
            'payment_status' => 'pending',
            'status' => 'pending',
            'notes' => null,
        ];
    }
}
