<?php

namespace App\Services\Admin;

use App\Models\Order;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    /** @var list<string> */
    public const STATUSES = [
        'pending',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
    ];

    /** @var array<string, list<string>> */
    private const TRANSITIONS = [
        'pending' => ['processing', 'cancelled'],
        'processing' => ['shipped', 'cancelled'],
        'shipped' => ['delivered'],
        'delivered' => [],
        'cancelled' => [],
    ];

    /**
     * List all customer orders for admin management.
     *
     * @param  array<string, mixed>  $filters
     */
    public function listOrders(array $filters = []): LengthAwarePaginator
    {
        $status = is_string($filters['status'] ?? null)
            ? trim($filters['status'])
            : '';
        $search = is_string($filters['search'] ?? null)
            ? trim($filters['search'])
            : '';
        $perPage = min(max((int) ($filters['per_page'] ?? 15), 1), 50);

        return Order::query()
            ->with($this->adminRelations())
            ->when(
                $status !== '',
                fn (Builder $query): Builder => $query->where('status', $status),
            )
            ->when(
                $search !== '',
                function (Builder $query) use ($search): void {
                    $query->where(function (Builder $query) use ($search): void {
                        $query
                            ->where('order_number', 'like', "%{$search}%")
                            ->orWhere('customer_name', 'like', "%{$search}%")
                            ->orWhere('customer_email', 'like', "%{$search}%");
                    });
                },
            )
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Get one fully hydrated order for admin management.
     */
    public function getOrder(Order $order): Order
    {
        return $order->load($this->adminRelations());
    }

    /**
     * Apply a controlled status transition.
     */
    public function updateStatus(Order $order, string $nextStatus): Order
    {
        return DB::transaction(function () use ($nextStatus, $order): Order {
            $lockedOrder = Order::query()
                ->whereKey($order->getKey())
                ->lockForUpdate()
                ->firstOrFail();
            $currentStatus = $lockedOrder->status;

            if ($currentStatus === $nextStatus) {
                return $this->getOrder($lockedOrder);
            }

            if (! in_array($nextStatus, self::STATUSES, true)) {
                throw ValidationException::withMessages([
                    'status' => 'The selected order status is invalid.',
                ]);
            }

            $allowedTransitions = self::TRANSITIONS[$currentStatus] ?? [];

            if (! in_array($nextStatus, $allowedTransitions, true)) {
                throw ValidationException::withMessages([
                    'status' => sprintf(
                        'An order cannot transition from %s to %s.',
                        $currentStatus,
                        $nextStatus,
                    ),
                ]);
            }

            $lockedOrder->update(['status' => $nextStatus]);

            return $this->getOrder($lockedOrder);
        });
    }

    /**
     * @return list<string>
     */
    private function adminRelations(): array
    {
        return [
            'user',
            'items.product.category',
            'items.product.primaryImage',
        ];
    }
}
