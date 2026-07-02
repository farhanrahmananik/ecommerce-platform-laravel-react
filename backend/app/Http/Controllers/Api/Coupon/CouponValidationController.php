<?php

namespace App\Http\Controllers\Api\Coupon;

use App\Http\Controllers\Controller;
use App\Http\Requests\Coupon\ValidateCouponRequest;
use App\Http\Resources\Coupon\CouponValidationResource;
use App\Services\Coupon\CouponValidationService;
use Illuminate\Http\JsonResponse;

class CouponValidationController extends Controller
{
    public function __invoke(
        ValidateCouponRequest $request,
        CouponValidationService $couponValidationService,
    ): JsonResponse {
        $result = $couponValidationService->validateForCart(
            $request->user(),
            $request->validated('code'),
        );

        return response()->json([
            'message' => 'Coupon is valid.',
            'data' => (new CouponValidationResource($result))->resolve($request),
        ]);
    }
}
