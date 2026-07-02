<?php

namespace App\Http\Resources\Order;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class OrderItemResource extends JsonResource
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
        $category = $product?->relationLoaded('category')
            ? $product->category
            : null;

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product_name,
            'product_sku' => $this->product_sku,
            'product_slug' => $product?->slug,
            'product_image_url' => $primaryImage
                ? Storage::disk('public')->url($primaryImage->image_path)
                : null,
            'unit_price' => $this->unit_price,
            'quantity' => $this->quantity,
            'line_total' => $this->line_total,
            'total' => $this->line_total,
            'product' => $this->when(
                $this->relationLoaded('product'),
                fn (): ?array => $product ? [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'category' => $category ? [
                        'id' => $category->id,
                        'name' => $category->name,
                        'slug' => $category->slug,
                    ] : null,
                ] : null,
            ),
        ];
    }
}
