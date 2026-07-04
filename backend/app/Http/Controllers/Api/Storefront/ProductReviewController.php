<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductReview\ListStorefrontProductReviewsRequest;
use App\Http\Resources\ProductReview\ProductReviewResource;
use App\Http\Resources\ProductReview\ProductReviewSummaryResource;
use App\Models\Product;
use App\Services\ProductReview\ProductReviewService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductReviewController extends Controller
{
    public function __construct(
        private readonly ProductReviewService $productReviewService,
    ) {}

    public function index(
        ListStorefrontProductReviewsRequest $request,
        Product $product,
    ): AnonymousResourceCollection {
        $reviews = $this->productReviewService->listApprovedForProduct(
            $product,
            $request->validated(),
        );

        return ProductReviewResource::collection($reviews)->additional([
            'summary' => (new ProductReviewSummaryResource(
                $this->productReviewService->ratingSummary($product),
            ))->resolve($request),
        ]);
    }
}
