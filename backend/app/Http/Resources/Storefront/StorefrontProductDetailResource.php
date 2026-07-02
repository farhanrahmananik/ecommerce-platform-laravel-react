<?php

namespace App\Http\Resources\Storefront;

use App\Http\Resources\ProductReview\ProductReviewSummaryResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StorefrontProductDetailResource extends JsonResource
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
            'sku' => $this->sku,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'price' => $this->price,
            'sale_price' => $this->sale_price,
            'effective_price' => number_format($effectivePrice, 2, '.', ''),
            'is_featured' => $this->is_featured,
            'category' => new StorefrontCategoryResource($this->whenLoaded('category')),
            'primary_image' => new StorefrontProductImageResource(
                $this->whenLoaded('primaryImage'),
            ),
            'images' => StorefrontProductImageResource::collection(
                $this->whenLoaded('images'),
            ),
            'rating_summary' => new ProductReviewSummaryResource(
                $this->rating_summary,
            ),
        ];
    }
}
