<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockMovementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'type' => $this->type, 'quantity_before' => $this->quantity_before, 'quantity_changed' => $this->quantity_changed, 'quantity_after' => $this->quantity_after, 'reason' => $this->reason, 'reference' => $this->reference_type ? ['type' => $this->reference_type, 'id' => $this->reference_id] : null, 'created_by' => $this->whenLoaded('createdBy', fn () => $this->createdBy ? ['id' => $this->createdBy->id, 'name' => $this->createdBy->name] : null), 'created_at' => $this->created_at?->toISOString()];
    }
}
