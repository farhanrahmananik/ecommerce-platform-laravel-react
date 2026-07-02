<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductImageRequest;
use App\Http\Requests\Admin\UpdateProductImageRequest;
use App\Http\Resources\Admin\ProductImageResource;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\Admin\ProductImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductImageController extends Controller
{
    public function __construct(
        private readonly ProductImageService $productImageService,
    ) {}

    public function index(Product $product): AnonymousResourceCollection
    {
        return ProductImageResource::collection(
            $this->productImageService->list($product),
        );
    }

    public function store(
        StoreProductImageRequest $request,
        Product $product,
    ): JsonResponse {
        $productImage = $this->productImageService->upload(
            $product,
            $request->validated(),
        );

        return (new ProductImageResource($productImage))
            ->response()
            ->setStatusCode(201);
    }

    public function update(
        UpdateProductImageRequest $request,
        Product $product,
        ProductImage $productImage,
    ): ProductImageResource {
        return new ProductImageResource(
            $this->productImageService->update(
                $product,
                $productImage,
                $request->validated(),
            ),
        );
    }

    public function destroy(
        Product $product,
        ProductImage $productImage,
    ): JsonResponse {
        $this->productImageService->delete($product, $productImage);

        return response()->json([
            'message' => 'Product image deleted successfully.',
        ]);
    }
}
