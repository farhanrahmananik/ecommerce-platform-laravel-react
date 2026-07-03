<?php

namespace App\Services\Admin;

use App\Models\Order;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockManagementService
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function listProducts(array $filters = []): LengthAwarePaginator
    {
        $search = trim((string) ($filters['search'] ?? ''));

        return Product::query()->with('primaryImage')
            ->when($search !== '', fn (Builder $query) => $query->where(fn (Builder $query) => $query->where('name', 'like', "%{$search}%")->orWhere('slug', 'like', "%{$search}%")->orWhere('sku', 'like', "%{$search}%")))
            ->when(filter_var($filters['low_stock'] ?? false, FILTER_VALIDATE_BOOL), fn (Builder $query) => $query->whereColumn('stock_quantity', '<=', 'low_stock_threshold'))
            ->orderBy('name')->paginate(min(max((int) ($filters['per_page'] ?? 15), 1), 50))->withQueryString();
    }

    public function listProductMovements(Product $product, array $filters = []): LengthAwarePaginator
    {
        return $product->stockMovements()->with('createdBy')->latest()->paginate(min(max((int) ($filters['per_page'] ?? 15), 1), 50))->withQueryString();
    }

    public function adjustProductStock(Product $product, array $data, User $user): Product
    {
        return DB::transaction(function () use ($data, $product, $user) {
            $locked = Product::query()->whereKey($product->getKey())->lockForUpdate()->firstOrFail();
            $before = $locked->stock_quantity;
            $after = (int) $data['quantity'];
            $locked->update(['stock_quantity' => $after]);
            $stockMovement = $locked->stockMovements()->create(['type' => StockMovement::TYPE_MANUAL_ADJUSTMENT, 'quantity_before' => $before, 'quantity_changed' => $after - $before, 'quantity_after' => $after, 'reason' => $data['reason'] ?? null, 'created_by_id' => $user->getKey()]);

            $this->auditLogService->record([
                'user_id' => $user->getKey(),
                'module' => 'stock',
                'action' => 'adjusted',
                'event' => 'stock.adjusted',
                'auditable_type' => $locked->getMorphClass(),
                'auditable_id' => $locked->getKey(),
                'description' => "Stock for product {$locked->name} was manually adjusted from {$before} to {$after}.",
                'old_values' => ['stock_quantity' => $before],
                'new_values' => ['stock_quantity' => $after],
                'metadata' => [
                    'adjustment_type' => StockMovement::TYPE_MANUAL_ADJUSTMENT,
                    'quantity' => $after,
                    'stock_delta' => $after - $before,
                    'reason' => $data['reason'] ?? null,
                    'stock_movement_id' => $stockMovement->getKey(),
                ],
            ]);

            return $locked->load('primaryImage');
        });
    }

    public function decreaseStockForOrder(Product $product, int $quantity, Order $order, ?User $user = null): Product
    {
        $locked = Product::query()->whereKey($product->getKey())->lockForUpdate()->firstOrFail();
        if ($locked->stock_quantity < $quantity) {
            throw ValidationException::withMessages(['cart' => "Insufficient stock for {$locked->name}."]);
        }
        $before = $locked->stock_quantity;
        $after = $before - $quantity;
        $locked->update(['stock_quantity' => $after]);
        $locked->stockMovements()->create(['type' => StockMovement::TYPE_ORDER_PLACED, 'quantity_before' => $before, 'quantity_changed' => -$quantity, 'quantity_after' => $after, 'reason' => 'Stock deducted at checkout.', 'reference_type' => 'order', 'reference_id' => $order->getKey(), 'created_by_id' => $user?->getKey()]);

        return $locked;
    }
}
