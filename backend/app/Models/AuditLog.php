<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'module', 'action', 'event', 'auditable_type', 'auditable_id', 'description', 'old_values', 'new_values', 'metadata', 'ip_address', 'user_agent'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return ['old_values' => 'array', 'new_values' => 'array', 'metadata' => 'array', 'auditable_id' => 'integer'];
    }
}
