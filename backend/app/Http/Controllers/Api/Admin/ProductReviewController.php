<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ListProductReviewsRequest;
use App\Http\Requests\Admin\ModerateProductReviewRequest;
use App\Http\Resources\ProductReview\ProductReviewResource;
use App\Models\ProductReview;
use App\Services\Admin\AdminProductReviewService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductReviewController extends Controller
{
    public function __construct(
        private readonly AdminProductReviewService $productReviewService,
    ) {}

    public function index(ListProductReviewsRequest $request): AnonymousResourceCollection
    {
        return ProductReviewResource::collection(
            $this->productReviewService->list($request->validated()),
        );
    }

    public function show(ProductReview $productReview): ProductReviewResource
    {
        return new ProductReviewResource(
            $this->productReviewService->show($productReview),
        );
    }

    public function moderate(
        ModerateProductReviewRequest $request,
        ProductReview $productReview,
    ): ProductReviewResource {
        return new ProductReviewResource(
            $this->productReviewService->moderate(
                $productReview,
                $request->validated(),
                $request->user(),
            ),
        );
    }
}
