<?php

namespace App\Services\Checkout;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    /**
     * Create an order from the user's current cart snapshot.
     *
     * @param  array<string, mixed>  $data
     */
    public function checkout(User $user, array $data): Order
    {
        return DB::transaction(function () use ($data, $user): Order {
            User::query()
                ->whereKey($user->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $cart = Cart::query()
                ->where('user_id', $user->getKey())
                ->lockForUpdate()
                ->first();

            if (! $cart) {
                $this->throwEmptyCartValidationException();
            }

            $cartItems = $cart->items()
                ->with('product')
                ->lockForUpdate()
                ->get();

            if ($cartItems->isEmpty()) {
                $this->throwEmptyCartValidationException();
            }

            $subtotal = $this->calculateSubtotal($cartItems);
            $billingAddress = $this->billingAddress($data);

            $order = Order::query()->create([
                'order_number' => $this->generateOrderNumber(),
                'user_id' => $user->getKey(),
                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'],
                'customer_phone' => $data['customer_phone'] ?? null,
                'shipping_address_line1' => $data['shipping_address_line1'],
                'shipping_address_line2' => $data['shipping_address_line2'] ?? null,
                'shipping_city' => $data['shipping_city'],
                'shipping_state' => $data['shipping_state'] ?? null,
                'shipping_postal_code' => $data['shipping_postal_code'],
                'shipping_country' => $data['shipping_country'],
                'billing_same_as_shipping' => $data['billing_same_as_shipping'],
                ...$billingAddress,
                'subtotal' => $subtotal,
                'shipping_amount' => '0.00',
                'discount_amount' => '0.00',
                'tax_amount' => '0.00',
                'total' => $subtotal,
                'payment_method' => $data['payment_method'],
                'payment_status' => 'pending',
                'status' => 'pending',
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($cartItems as $cartItem) {
                $lineTotal = $this->lineTotal(
                    $cartItem->unit_price,
                    $cartItem->quantity,
                );

                $order->orderItems()->create([
                    'product_id' => $cartItem->product_id,
                    'product_name' => $cartItem->product?->name
                        ?? "Product #{$cartItem->product_id}",
                    'product_sku' => $cartItem->product?->sku,
                    'unit_price' => $cartItem->unit_price,
                    'quantity' => $cartItem->quantity,
                    'line_total' => $lineTotal,
                ]);
            }

            $cart->items()->delete();
            $cart->touch();

            return $order->load('orderItems');
        });
    }

    /**
     * @param  Collection<int, CartItem>  $cartItems
     */
    private function calculateSubtotal(Collection $cartItems): string
    {
        $subtotal = $cartItems->sum(
            fn (CartItem $item): float => (float) $this->lineTotal(
                $item->unit_price,
                $item->quantity,
            ),
        );

        return number_format($subtotal, 2, '.', '');
    }

    private function lineTotal(string $unitPrice, int $quantity): string
    {
        return number_format((float) $unitPrice * $quantity, 2, '.', '');
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, string|null>
     */
    private function billingAddress(array $data): array
    {
        if ($data['billing_same_as_shipping']) {
            return [
                'billing_address_line1' => $data['shipping_address_line1'],
                'billing_address_line2' => $data['shipping_address_line2'] ?? null,
                'billing_city' => $data['shipping_city'],
                'billing_state' => $data['shipping_state'] ?? null,
                'billing_postal_code' => $data['shipping_postal_code'],
                'billing_country' => $data['shipping_country'],
            ];
        }

        return [
            'billing_address_line1' => $data['billing_address_line1'],
            'billing_address_line2' => $data['billing_address_line2'] ?? null,
            'billing_city' => $data['billing_city'],
            'billing_state' => $data['billing_state'] ?? null,
            'billing_postal_code' => $data['billing_postal_code'],
            'billing_country' => $data['billing_country'],
        ];
    }

    private function generateOrderNumber(): string
    {
        do {
            $orderNumber = sprintf(
                'ORD-%s-%s',
                now()->format('Ymd'),
                Str::upper(Str::random(6)),
            );
        } while (Order::query()->where('order_number', $orderNumber)->exists());

        return $orderNumber;
    }

    private function throwEmptyCartValidationException(): never
    {
        throw ValidationException::withMessages([
            'cart' => 'Your cart is empty.',
        ]);
    }
}
