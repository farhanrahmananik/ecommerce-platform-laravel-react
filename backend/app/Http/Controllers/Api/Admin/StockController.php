<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Stock\AdjustStockRequest;
use App\Http\Resources\Admin\StockMovementResource;
use App\Http\Resources\Admin\StockProductResource;
use App\Models\Product;
use App\Services\Admin\StockManagementService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StockController extends Controller
{
    public function __construct(private readonly StockManagementService $service) {}

    public function products(Request $request): AnonymousResourceCollection
    {
        return StockProductResource::collection($this->service->listProducts($request->only(['search', 'low_stock', 'per_page'])));
    }

    public function movements(Request $request, Product $product): AnonymousResourceCollection
    {
        return StockMovementResource::collection($this->service->listProductMovements($product, $request->only('per_page')));
    }

    public function adjust(AdjustStockRequest $request, Product $product): StockProductResource
    {
        return new StockProductResource($this->service->adjustProductStock($product, $request->validated(), $request->user()));
    }
}
