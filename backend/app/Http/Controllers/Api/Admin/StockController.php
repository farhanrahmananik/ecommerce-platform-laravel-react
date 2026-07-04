<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Stock\AdjustStockRequest;
use App\Http\Requests\Admin\Stock\ListStockMovementsRequest;
use App\Http\Requests\Admin\Stock\ListStockProductsRequest;
use App\Http\Resources\Admin\StockMovementResource;
use App\Http\Resources\Admin\StockProductResource;
use App\Models\Product;
use App\Services\Admin\StockManagementService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StockController extends Controller
{
    public function __construct(private readonly StockManagementService $service) {}

    public function products(ListStockProductsRequest $request): AnonymousResourceCollection
    {
        return StockProductResource::collection(
            $this->service->listProducts($request->validated()),
        );
    }

    public function movements(
        ListStockMovementsRequest $request,
        Product $product,
    ): AnonymousResourceCollection {
        return StockMovementResource::collection(
            $this->service->listProductMovements($product, $request->validated()),
        );
    }

    public function adjust(AdjustStockRequest $request, Product $product): StockProductResource
    {
        return new StockProductResource($this->service->adjustProductStock($product, $request->validated(), $request->user()));
    }
}
