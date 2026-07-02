<?php

namespace App\Services\Order;

use App\Models\Order;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class OrderService
{
    /**
     * List the user's orders, newest first.
     *
     * @param  array<string, mixed>  $filters
     */
    public function listOrdersForUser(
        User $user,
        array $filters = [],
    ): LengthAwarePaginator {
        $status = is_string($filters['status'] ?? null)
            ? trim($filters['status'])
            : '';
        $search = is_string($filters['search'] ?? null)
            ? trim($filters['search'])
            : '';
        $perPage = min(max((int) ($filters['per_page'] ?? 10), 1), 50);

        return Order::query()
            ->where('user_id', $user->getKey())
            ->with($this->customerRelations())
            ->when(
                $status !== '',
                fn ($query) => $query->where('status', $status),
            )
            ->when(
                $search !== '',
                fn ($query) => $query->where(
                    'order_number',
                    'like',
                    "%{$search}%",
                ),
            )
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Get one owned order or fail without revealing another customer's order.
     */
    public function getOrderForUser(User $user, Order $order): Order
    {
        return Order::query()
            ->where('user_id', $user->getKey())
            ->whereKey($order->getKey())
            ->with($this->customerRelations())
            ->firstOrFail();
    }

    /**
     * @return list<string>
     */
    private function customerRelations(): array
    {
        return [
            'items.product.category',
            'items.product.primaryImage',
        ];
    }
}
