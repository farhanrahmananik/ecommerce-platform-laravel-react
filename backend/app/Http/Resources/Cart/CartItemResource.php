<?php

namespace App\Http\Resources\Cart;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CartItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $product = $this->relationLoaded('product') ? $this->product : null;
        $primaryImage = $product?->relationLoaded('primaryImage')
            ? $product->primaryImage
            : null;

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $product?->name,
            'product_slug' => $product?->slug,
            'product_image_url' => $primaryImage
                ? Storage::disk('public')->url($primaryImage->image_path)
                : null,
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'line_total' => $this->line_total,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
