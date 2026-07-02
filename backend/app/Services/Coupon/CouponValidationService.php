<?php

namespace App\Services\Coupon;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Coupon;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CouponValidationService
{
    /**
     * Validate a coupon against the authenticated user's current cart.
     *
     * @return array<string, mixed>
     */
    public function validateForCart(User $user, string $code): array
    {
        $cart = Cart::query()
            ->where('user_id', $user->getKey())
            ->with('items')
            ->first();

        if (! $cart || $cart->items->isEmpty()) {
            $this->throwEmptyCartValidationException();
        }

        return $this->validateForSubtotal(
            $user,
            $code,
            $this->calculateCartSubtotal($cart->items),
            errorField: 'code',
        );
    }

    /**
     * Validate and calculate a coupon for a known cart subtotal.
     *
     * @return array<string, mixed>
     */
    public function validateForSubtotal(
        User $user,
        string $code,
        string $subtotal,
        bool $lockForUpdate = false,
        string $errorField = 'coupon_code',
    ): array {
        $normalizedCode = Str::upper(trim($code));
        $query = Coupon::query()->where('code', $normalizedCode);

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        $coupon = $query->first();

        if (! $coupon) {
            throw ValidationException::withMessages([
                $errorField => 'The coupon code is invalid.',
            ]);
        }

        $this->assertCouponIsUsable(
            $coupon,
            $user,
            $subtotal,
            $errorField,
        );

        $discountAmount = $this->calculateDiscount($coupon, $subtotal);
        $totalAfterDiscount = $this->subtractMoney($subtotal, $discountAmount);

        return [
            'coupon' => $coupon,
            'code' => $coupon->code,
            'type' => $coupon->type,
            'value' => $coupon->value,
            'discount_amount' => $discountAmount,
            'cart_subtotal' => $this->formatMoney($this->moneyToCents($subtotal)),
            'total_after_discount' => $totalAfterDiscount,
            'min_order_amount' => $coupon->min_order_amount,
            'expires_at' => $coupon->expires_at,
        ];
    }

    public function calculateDiscount(Coupon $coupon, string $subtotal): string
    {
        $subtotalCents = $this->moneyToCents($subtotal);

        $discountCents = match ($coupon->type) {
            'fixed' => $this->moneyToCents($coupon->value),
            'percentage' => (int) round(
                $subtotalCents * ((float) $coupon->value / 100),
            ),
            default => 0,
        };

        if ($coupon->type === 'percentage'
            && $coupon->max_discount_amount !== null) {
            $discountCents = min(
                $discountCents,
                $this->moneyToCents($coupon->max_discount_amount),
            );
        }

        return $this->formatMoney(min($discountCents, $subtotalCents));
    }

    public function assertCouponIsUsable(
        Coupon $coupon,
        User $user,
        string $subtotal,
        string $errorField = 'coupon_code',
    ): void {
        $now = now();

        if (! $coupon->is_active) {
            $this->throwCouponValidationException(
                'This coupon is inactive.',
                $errorField,
            );
        }

        if ($coupon->starts_at !== null && $coupon->starts_at->isAfter($now)) {
            $this->throwCouponValidationException(
                'This coupon is not active yet.',
                $errorField,
            );
        }

        if ($coupon->expires_at !== null && $coupon->expires_at->isBefore($now)) {
            $this->throwCouponValidationException(
                'This coupon has expired.',
                $errorField,
            );
        }

        if ($this->moneyToCents($subtotal)
            < $this->moneyToCents($coupon->min_order_amount)) {
            $this->throwCouponValidationException(
                'Your cart subtotal does not meet the minimum order amount for this coupon.',
                $errorField,
            );
        }

        if ($coupon->usage_limit !== null
            && $coupon->used_count >= $coupon->usage_limit) {
            $this->throwCouponValidationException(
                'This coupon has reached its usage limit.',
                $errorField,
            );
        }

        if ($coupon->usage_limit_per_user !== null
            && $coupon->redemptions()
                ->where('user_id', $user->getKey())
                ->count() >= $coupon->usage_limit_per_user) {
            $this->throwCouponValidationException(
                'You have reached the usage limit for this coupon.',
                $errorField,
            );
        }

        if (! in_array($coupon->type, ['fixed', 'percentage'], true)) {
            $this->throwCouponValidationException(
                'This coupon type is not supported.',
                $errorField,
            );
        }
    }

    /**
     * @param  Collection<int, CartItem>  $items
     */
    private function calculateCartSubtotal(Collection $items): string
    {
        $subtotalCents = $items->sum(
            fn (CartItem $item): int => $this->moneyToCents($item->line_total),
        );

        return $this->formatMoney($subtotalCents);
    }

    private function subtractMoney(string $amount, string $discount): string
    {
        return $this->formatMoney(max(
            0,
            $this->moneyToCents($amount) - $this->moneyToCents($discount),
        ));
    }

    private function moneyToCents(string|int|float|null $amount): int
    {
        return (int) round((float) $amount * 100);
    }

    private function formatMoney(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }

    private function throwCouponValidationException(
        string $message,
        string $errorField,
    ): never {
        throw ValidationException::withMessages([
            $errorField => $message,
        ]);
    }

    private function throwEmptyCartValidationException(): never
    {
        throw ValidationException::withMessages([
            'cart' => 'Your cart is empty.',
        ]);
    }
}
