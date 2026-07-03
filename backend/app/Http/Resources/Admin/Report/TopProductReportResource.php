<?php

namespace App\Http\Resources\Admin\Report;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TopProductReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => (int) $this->resource['id'], 'name' => $this->resource['name'], 'sku' => $this->resource['sku'], 'total_quantity_sold' => (int) $this->resource['total_quantity_sold'], 'gross_sales' => round((float) $this->resource['gross_sales'], 2), 'current_stock_quantity' => (int) $this->resource['current_stock_quantity']];
    }
}
