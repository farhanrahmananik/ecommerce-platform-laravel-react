<?php

namespace App\Services\Admin;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class ReportService
{
    private function range(array $filters): array
    {
        return [isset($filters['start_date']) ? Carbon::parse($filters['start_date'])->startOfDay() : now()->subDays(29)->startOfDay(), isset($filters['end_date']) ? Carbon::parse($filters['end_date'])->endOfDay() : now()->endOfDay()];
    }

    private function orders(array $filters): Builder
    {
        [$start,$end] = $this->range($filters);

        return Order::query()->whereBetween('created_at', [$start, $end]);
    }

    public function summary(array $filters): array
    {
        $all = $this->orders($filters);
        $sales = (clone $all)->where('status', '!=', 'cancelled');
        $count = (clone $sales)->count();

        return ['total_orders' => (clone $all)->count(), 'gross_sales' => round((float) (clone $sales)->sum('subtotal'), 2), 'net_sales' => round((float) (clone $sales)->sum('total'), 2), 'average_order_value' => $count ? round((float) (clone $sales)->avg('total'), 2) : 0.0, 'pending_orders' => (clone $all)->where('status', 'pending')->count(), 'processing_orders' => (clone $all)->whereIn('status', ['processing', 'shipped'])->count(), 'completed_orders' => (clone $all)->where('status', 'delivered')->count(), 'cancelled_orders' => (clone $all)->where('status', 'cancelled')->count(), 'total_customers' => User::query()->where('role', 'customer')->count(), 'low_stock_products' => Product::query()->where('stock_quantity', '>', 0)->whereColumn('stock_quantity', '<=', 'low_stock_threshold')->count(), 'out_of_stock_products' => Product::query()->where('stock_quantity', 0)->count(), 'total_reviews' => ProductReview::query()->approved()->count(), 'average_rating' => round((float) (ProductReview::query()->approved()->avg('rating') ?? 0), 2)];
    }

    public function sales(array $filters): array
    {
        [$start,$end] = $this->range($filters);

        return DB::table('orders')->whereBetween('created_at', [$start, $end])->where('status', '!=', 'cancelled')->selectRaw('DATE(created_at) as date, COUNT(*) as orders_count, COALESCE(SUM(subtotal),0) as gross_sales, COALESCE(SUM(total),0) as net_sales')->groupByRaw('DATE(created_at)')->orderBy('date')->get()->map(fn ($r) => (array) $r)->all();
    }

    public function topProducts(array $filters): array
    {
        [$start,$end] = $this->range($filters);

        return DB::table('order_items')->join('orders', 'orders.id', '=', 'order_items.order_id')->leftJoin('products', 'products.id', '=', 'order_items.product_id')->whereBetween('orders.created_at', [$start, $end])->where('orders.status', '!=', 'cancelled')->selectRaw('order_items.product_id as id, MAX(order_items.product_name) as name, MAX(order_items.product_sku) as sku, SUM(order_items.quantity) as total_quantity_sold, SUM(order_items.line_total) as gross_sales, COALESCE(MAX(products.stock_quantity),0) as current_stock_quantity')->groupBy('order_items.product_id')->orderByDesc('total_quantity_sold')->limit((int) ($filters['limit'] ?? 10))->get()->map(fn ($r) => (array) $r)->all();
    }

    public function stock(array $filters): array
    {
        $search = trim((string) ($filters['search'] ?? ''));

        return Product::query()->with('category')->when($search !== '', fn (Builder $q) => $q->where(fn (Builder $q) => $q->where('name', 'like', "%{$search}%")->orWhere('sku', 'like', "%{$search}%")->orWhere('slug', 'like', "%{$search}%")))->when($filters['category_id'] ?? null, fn (Builder $q, $id) => $q->where('category_id', $id))->get()->map(function (Product $p) {
            $status = $p->stock_quantity === 0 ? 'out_of_stock' : ($p->stock_quantity <= $p->low_stock_threshold ? 'low_stock' : 'in_stock');

            return ['id' => $p->id, 'name' => $p->name, 'sku' => $p->sku, 'category' => $p->category?->name, 'stock_quantity' => $p->stock_quantity, 'low_stock_threshold' => $p->low_stock_threshold, 'stock_status' => $status];
        })->when($filters['status'] ?? null, fn ($c,$s) => $c->where('stock_status',$s))->values()->all();
    }
}
