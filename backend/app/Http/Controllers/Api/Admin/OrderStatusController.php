<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateOrderStatusRequest;
use App\Http\Resources\Admin\AdminOrderResource;
use App\Models\Order;
use App\Services\Admin\OrderService;

class OrderStatusController extends Controller
{
    public function __construct(private readonly OrderService $orderService) {}

    public function update(
        UpdateOrderStatusRequest $request,
        Order $order,
    ): AdminOrderResource {
        return new AdminOrderResource(
            $this->orderService->updateStatus(
                $order,
                $request->string('status')->toString(),
            ),
        );
    }
}
