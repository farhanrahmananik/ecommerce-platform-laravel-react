<?php

namespace App\Http\Controllers\Api\Cart;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cart\AddCartItemRequest;
use App\Http\Requests\Cart\UpdateCartItemRequest;
use App\Http\Resources\Cart\CartResource;
use App\Models\CartItem;
use App\Models\Product;
use App\Services\Cart\CartService;
use Illuminate\Http\Request;

class CartItemController extends Controller
{
    public function __construct(private readonly CartService $cartService) {}

    public function store(AddCartItemRequest $request): CartResource
    {
        $product = Product::query()->findOrFail(
            $request->integer('product_id'),
        );

        return new CartResource(
            $this->cartService->addItem(
                $request->user(),
                $product,
                $request->integer('quantity'),
            ),
        );
    }

    public function update(
        UpdateCartItemRequest $request,
        CartItem $cartItem,
    ): CartResource {
        return new CartResource(
            $this->cartService->updateItem(
                $request->user(),
                $cartItem,
                $request->integer('quantity'),
            ),
        );
    }

    public function destroy(Request $request, CartItem $cartItem): CartResource
    {
        return new CartResource(
            $this->cartService->removeItem($request->user(), $cartItem),
        );
    }
}
