<?php

namespace App\Http\Controllers\Api\Checkout;

use App\Http\Controllers\Controller;
use App\Http\Requests\Checkout\StoreCheckoutRequest;
use App\Http\Resources\Order\OrderResource;
use App\Services\Checkout\CheckoutService;
use Illuminate\Http\JsonResponse;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly CheckoutService $checkoutService,
    ) {}

    public function store(StoreCheckoutRequest $request): JsonResponse
    {
        $order = $this->checkoutService->checkout(
            $request->user(),
            $request->validated(),
        );

        return (new OrderResource($order))
            ->response()
            ->setStatusCode(201);
    }
}
