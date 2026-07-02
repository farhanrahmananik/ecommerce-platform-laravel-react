<?php

namespace App\Http\Controllers\Api\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductReview\StoreProductReviewRequest;
use App\Http\Requests\ProductReview\UpdateProductReviewRequest;
use App\Http\Resources\ProductReview\ProductReviewResource;
use App\Models\Product;
use App\Models\ProductReview;
use App\Services\ProductReview\ProductReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductReviewController extends Controller
{
    public function __construct(
        private readonly ProductReviewService $productReviewService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return ProductReviewResource::collection(
            $this->productReviewService->listForUser(
                $request->user(),
                $request->only(['status', 'per_page']),
            ),
        );
    }

    public function store(
        StoreProductReviewRequest $request,
        Product $product,
    ): JsonResponse {
        return (new ProductReviewResource(
            $this->productReviewService->createReview(
                $request->user(),
                $product,
                $request->validated(),
            ),
        ))->response()->setStatusCode(201);
    }

    public function update(
        UpdateProductReviewRequest $request,
        ProductReview $productReview,
    ): ProductReviewResource {
        return new ProductReviewResource(
            $this->productReviewService->updateReview(
                $request->user(),
                $productReview,
                $request->validated(),
            ),
        );
    }

    public function destroy(
        Request $request,
        ProductReview $productReview,
    ): JsonResponse {
        $this->productReviewService->deleteReview(
            $request->user(),
            $productReview,
        );

        return response()->json([
            'message' => 'Review deleted successfully.',
        ]);
    }
}
