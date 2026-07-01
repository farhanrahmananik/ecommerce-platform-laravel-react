<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardSummaryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'stats' => $this->resource['stats'],
            'quick_actions' => $this->resource['quick_actions'],
            'recent_activity' => $this->resource['recent_activity'],
            'system' => $this->resource['system'],
        ];
    }
}
