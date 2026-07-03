<?php

namespace App\Http\Resources\Admin\Report;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return $this->resource;
    }
}
