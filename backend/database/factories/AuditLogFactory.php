<?php

namespace Database\Factories;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AuditLogFactory extends Factory
{
    protected $model = AuditLog::class;

    public function definition(): array
    {
        return ['user_id' => User::factory(), 'module' => 'products', 'action' => 'update', 'event' => 'updated', 'auditable_type' => 'App\\Models\\Product', 'auditable_id' => fake()->numberBetween(1, 999), 'description' => fake()->sentence(), 'old_values' => ['name' => 'Old'], 'new_values' => ['name' => 'New'], 'metadata' => ['source' => 'test'], 'ip_address' => fake()->ipv4(), 'user_agent' => fake()->userAgent()];
    }
}
