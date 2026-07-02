<?php

namespace App\Http\Controllers\Api\Cart;

use App\Http\Controllers\Controller;
use App\Http\Resources\Cart\CartResource;
use App\Services\Cart\CartService;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(private readonly CartService $cartService) {}

    public function index(Request $request): CartResource
    {
        return new CartResource(
            $this->cartService->getCartForUser($request->user()),
        );
    }

    public function destroy(Request $request): CartResource
    {
        return new CartResource(
            $this->cartService->clearCart($request->user()),
        );
    }
}
