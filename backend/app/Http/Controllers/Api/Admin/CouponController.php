<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Coupon\StoreCouponRequest;
use App\Http\Requests\Admin\Coupon\UpdateCouponRequest;
use App\Http\Resources\Admin\CouponResource;
use App\Models\Coupon;
use App\Services\Admin\CouponService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CouponController extends Controller
{
    public function __construct(private readonly CouponService $couponService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $coupons = $this->couponService->list(
            $request->only(['search', 'status', 'type', 'per_page']),
        );

        return CouponResource::collection($coupons);
    }

    public function store(StoreCouponRequest $request): JsonResponse
    {
        $coupon = $this->couponService->create(
            $request->validated(),
            $request->user(),
        );

        return (new CouponResource($coupon))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Coupon $coupon): CouponResource
    {
        return new CouponResource($this->couponService->show($coupon));
    }

    public function update(
        UpdateCouponRequest $request,
        Coupon $coupon,
    ): CouponResource {
        return new CouponResource(
            $this->couponService->update($coupon, $request->validated()),
        );
    }

    public function destroy(Coupon $coupon): JsonResponse
    {
        $this->couponService->delete($coupon);

        return response()->json([
            'message' => 'Coupon deleted successfully.',
        ]);
    }
}
