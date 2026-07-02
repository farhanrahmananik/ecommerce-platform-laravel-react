<?php

namespace App\Http\Resources\Order;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $billingAddress = $this->billing_address_line1 !== null
            ? [
                'line1' => $this->billing_address_line1,
                'line2' => $this->billing_address_line2,
                'city' => $this->billing_city,
                'state' => $this->billing_state,
                'postal_code' => $this->billing_postal_code,
                'country' => $this->billing_country,
            ]
            : null;

        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'customer_name' => $this->customer_name,
            'customer_email' => $this->customer_email,
            'customer_phone' => $this->customer_phone,
            'shipping_address' => [
                'line1' => $this->shipping_address_line1,
                'line2' => $this->shipping_address_line2,
                'city' => $this->shipping_city,
                'state' => $this->shipping_state,
                'postal_code' => $this->shipping_postal_code,
                'country' => $this->shipping_country,
            ],
            'billing_same_as_shipping' => $this->billing_same_as_shipping,
            'billing_address' => $billingAddress,
            'subtotal' => $this->subtotal,
            'shipping_amount' => $this->shipping_amount,
            'discount_amount' => $this->discount_amount,
            'tax_amount' => $this->tax_amount,
            'total' => $this->total,
            'payment_method' => $this->payment_method,
            'payment_status' => $this->payment_status,
            'status' => $this->status,
            'notes' => $this->notes,
            'items' => OrderItemResource::collection(
                $this->whenLoaded('orderItems'),
            ),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
