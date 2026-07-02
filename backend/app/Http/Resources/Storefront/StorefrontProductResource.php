<?php

namespace App\Http\Resources\Storefront;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StorefrontProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $price = (float) $this->price;
        $salePrice = $this->sale_price !== null ? (float) $this->sale_price : null;
        $effectivePrice = $salePrice !== null && $salePrice < $price
            ? $salePrice
            : $price;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'short_description' => $this->short_description,
            'price' => $this->price,
            'sale_price' => $this->sale_price,
            'effective_price' => number_format($effectivePrice, 2, '.', ''),
            'is_featured' => $this->is_featured,
            'category' => new StorefrontCategoryResource($this->whenLoaded('category')),
            'primary_image' => new StorefrontProductImageResource(
                $this->whenLoaded('primaryImage'),
            ),
        ];
    }
}
