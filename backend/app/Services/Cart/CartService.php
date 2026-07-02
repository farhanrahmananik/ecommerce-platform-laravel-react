<?php

namespace App\Services\Cart;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CartService
{
    /**
     * Get or create the user's single active cart.
     */
    public function getOrCreateCart(User $user): Cart
    {
        $cart = DB::transaction(
            fn (): Cart => $this->getLockedCartForUser($user),
        );

        return $this->loadCart($cart);
    }

    /**
     * Get the user's hydrated cart.
     */
    public function getCartForUser(User $user): Cart
    {
        return $this->getOrCreateCart($user);
    }

    /**
     * Add a product or merge it into an existing cart line.
     */
    public function addItem(User $user, Product $product, int $quantity): Cart
    {
        $this->ensureValidQuantity($quantity);

        return DB::transaction(function () use ($product, $quantity, $user): Cart {
            $cart = $this->getLockedCartForUser($user);
            $cartItem = $cart->items()
                ->where('product_id', $product->getKey())
                ->lockForUpdate()
                ->first();
            $lockedProduct = Product::query()
                ->whereKey($product->getKey())
                ->lockForUpdate()
                ->firstOrFail();
            $newQuantity = ($cartItem?->quantity ?? 0) + $quantity;

            $this->ensureProductAvailable($lockedProduct, $newQuantity);

            $unitPrice = $this->effectivePrice($lockedProduct);
            $values = [
                'quantity' => $newQuantity,
                'unit_price' => $unitPrice,
                'line_total' => $this->lineTotal($unitPrice, $newQuantity),
            ];

            if ($cartItem) {
                $cartItem->update($values);
            } else {
                $cart->items()->create([
                    'product_id' => $lockedProduct->getKey(),
                    ...$values,
                ]);
            }

            $cart->touch();

            return $this->loadCart($cart);
        });
    }

    /**
     * Update an owned cart item's quantity and current price snapshot.
     */
    public function updateItem(
        User $user,
        CartItem $cartItem,
        int $quantity,
    ): Cart {
        $this->ensureValidQuantity($quantity);

        return DB::transaction(function () use ($cartItem, $quantity, $user): Cart {
            $cart = $this->getLockedCartForUser($user);
            $lockedItem = $cart->items()
                ->whereKey($cartItem->getKey())
                ->lockForUpdate()
                ->firstOrFail();
            $product = Product::query()
                ->whereKey($lockedItem->product_id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureProductAvailable($product, $quantity);

            $unitPrice = $this->effectivePrice($product);

            $lockedItem->update([
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'line_total' => $this->lineTotal($unitPrice, $quantity),
            ]);

            $cart->touch();

            return $this->loadCart($cart);
        });
    }

    /**
     * Remove an owned item from the cart.
     */
    public function removeItem(User $user, CartItem $cartItem): Cart
    {
        return DB::transaction(function () use ($cartItem, $user): Cart {
            $cart = $this->getLockedCartForUser($user);
            $lockedItem = $cart->items()
                ->whereKey($cartItem->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $lockedItem->delete();
            $cart->touch();

            return $this->loadCart($cart);
        });
    }

    /**
     * Remove every item from the user's cart.
     */
    public function clearCart(User $user): Cart
    {
        return DB::transaction(function () use ($user): Cart {
            $cart = $this->getLockedCartForUser($user);

            $cart->items()->delete();
            $cart->touch();

            return $this->loadCart($cart);
        });
    }

    private function getLockedCartForUser(User $user): Cart
    {
        User::query()
            ->whereKey($user->getKey())
            ->lockForUpdate()
            ->firstOrFail();

        return Cart::query()->firstOrCreate([
            'user_id' => $user->getKey(),
        ]);
    }

    private function loadCart(Cart $cart): Cart
    {
        return ($cart->fresh() ?? $cart)->load(['items.product.primaryImage']);
    }

    private function ensureValidQuantity(int $quantity): void
    {
        if ($quantity < 1) {
            throw ValidationException::withMessages([
                'quantity' => 'The quantity must be at least 1.',
            ]);
        }
    }

    private function ensureProductAvailable(Product $product, int $quantity): void
    {
        if (! $product->is_active) {
            throw ValidationException::withMessages([
                'product_id' => 'This product is not available.',
            ]);
        }

        if ($product->stock_quantity < 1) {
            throw ValidationException::withMessages([
                'quantity' => 'This product is out of stock.',
            ]);
        }

        if ($quantity > $product->stock_quantity) {
            throw ValidationException::withMessages([
                'quantity' => 'The requested quantity exceeds available stock.',
            ]);
        }
    }

    private function effectivePrice(Product $product): string
    {
        $price = (float) $product->price;
        $salePrice = $product->sale_price !== null
            ? (float) $product->sale_price
            : null;
        $effectivePrice = $salePrice !== null && $salePrice < $price
            ? $salePrice
            : $price;

        return number_format($effectivePrice, 2, '.', '');
    }

    private function lineTotal(string $unitPrice, int $quantity): string
    {
        return number_format((float) $unitPrice * $quantity, 2, '.', '');
    }
}
