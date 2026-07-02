<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Resources\Storefront\StorefrontCategoryResource;
use App\Services\Storefront\StorefrontCategoryService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StorefrontCategoryController extends Controller
{
    public function __construct(
        private readonly StorefrontCategoryService $storefrontCategoryService,
    ) {}

    public function index(): AnonymousResourceCollection
    {
        return StorefrontCategoryResource::collection(
            $this->storefrontCategoryService->getActiveCategories(),
        );
    }
}
