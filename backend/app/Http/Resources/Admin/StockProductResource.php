<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'name' => $this->name, 'slug' => $this->slug, 'sku' => $this->sku, 'is_active' => $this->is_active, 'stock_quantity' => $this->stock_quantity, 'low_stock_threshold' => $this->low_stock_threshold, 'is_low_stock' => $this->stock_quantity <= $this->low_stock_threshold, 'price' => $this->price, 'primary_image' => new ProductImageResource($this->whenLoaded('primaryImage')), 'created_at' => $this->created_at?->toISOString(), 'updated_at' => $this->updated_at?->toISOString()];
    }
}
