<?php

namespace App\Http\Resources\Admin\Report;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalesReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['date' => $this->resource['date'], 'orders_count' => (int) $this->resource['orders_count'], 'gross_sales' => round((float) $this->resource['gross_sales'], 2), 'net_sales' => round((float) $this->resource['net_sales'], 2)];
    }
}
