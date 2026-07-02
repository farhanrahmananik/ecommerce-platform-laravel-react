<?php

namespace App\Http\Resources\Cart;

use App\Models\CartItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $items = $this->relationLoaded('items') ? $this->items : collect();
        $itemsCount = $items->sum(
            fn (CartItem $item): int => $item->quantity,
        );
        $subtotal = $items->sum(
            fn (CartItem $item): float => (float) $item->line_total,
        );
        $formattedSubtotal = number_format($subtotal, 2, '.', '');

        return [
            'id' => $this->id,
            'items' => CartItemResource::collection($this->whenLoaded('items')),
            'items_count' => $itemsCount,
            'subtotal' => $formattedSubtotal,
            'total' => $formattedSubtotal,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
