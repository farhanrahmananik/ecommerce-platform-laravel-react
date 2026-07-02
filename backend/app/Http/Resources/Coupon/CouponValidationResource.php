<?php

namespace App\Http\Resources\Coupon;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CouponValidationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'code' => $this->resource['code'],
            'type' => $this->resource['type'],
            'value' => $this->resource['value'],
            'discount_amount' => $this->resource['discount_amount'],
            'cart_subtotal' => $this->resource['cart_subtotal'],
            'total_after_discount' => $this->resource['total_after_discount'],
            'min_order_amount' => $this->resource['min_order_amount'],
            'expires_at' => $this->resource['expires_at']?->toISOString(),
        ];
    }
}
