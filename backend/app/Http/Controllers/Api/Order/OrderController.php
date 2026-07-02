<?php

namespace App\Http\Controllers\Api\Order;

use App\Http\Controllers\Controller;
use App\Http\Resources\Order\OrderResource;
use App\Models\Order;
use App\Services\Order\OrderService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orderService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = $this->orderService->listOrdersForUser(
            $request->user(),
            $request->only(['status', 'search', 'per_page']),
        );

        return OrderResource::collection($orders);
    }

    public function show(Request $request, Order $order): OrderResource
    {
        return new OrderResource(
            $this->orderService->getOrderForUser($request->user(), $order),
        );
    }
}
