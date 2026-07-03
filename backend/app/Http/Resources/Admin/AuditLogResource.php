<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'module' => $this->module, 'action' => $this->action, 'event' => $this->event, 'description' => $this->description, 'auditable_type' => $this->auditable_type, 'auditable_id' => $this->auditable_id, 'old_values' => $this->old_values, 'new_values' => $this->new_values, 'metadata' => $this->metadata, 'ip_address' => $this->ip_address, 'user_agent' => $this->user_agent, 'created_at' => $this->created_at?->toISOString(), 'updated_at' => $this->updated_at?->toISOString(), 'user' => $this->whenLoaded('user', fn () => $this->user ? ['id' => $this->user->id, 'name' => $this->user->name, 'email' => $this->user->email, 'role' => $this->user->role] : null)];
    }
}
