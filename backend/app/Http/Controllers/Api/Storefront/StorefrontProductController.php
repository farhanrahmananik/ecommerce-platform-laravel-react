<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\ListStorefrontProductsRequest;
use App\Http\Resources\Storefront\StorefrontProductResource;
use App\Services\Storefront\StorefrontProductService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StorefrontProductController extends Controller
{
    public function __construct(
        private readonly StorefrontProductService $storefrontProductService,
    ) {}

    public function index(
        ListStorefrontProductsRequest $request,
    ): AnonymousResourceCollection {
        return StorefrontProductResource::collection(
            $this->storefrontProductService->paginate($request->validated()),
        );
    }
}
