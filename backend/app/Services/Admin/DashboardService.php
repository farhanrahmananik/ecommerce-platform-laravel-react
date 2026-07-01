<?php

namespace App\Services\Admin;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardService
{
    /**
     * Build the read-only dashboard summary.
     *
     * @return array<string, mixed>
     */
    public function getSummary(): array
    {
        return [
            'stats' => [
                [
                    'label' => 'Customers',
                    'value' => $this->countTable('users'),
                    'icon' => 'bi-people',
                    'variant' => 'primary',
                    'description' => 'Registered customer accounts',
                ],
                [
                    'label' => 'Products',
                    'value' => $this->countTable('products'),
                    'icon' => 'bi-box-seam',
                    'variant' => 'success',
                    'description' => 'Products in the catalog',
                ],
                [
                    'label' => 'Orders',
                    'value' => $this->countTable('orders'),
                    'icon' => 'bi-receipt',
                    'variant' => 'warning',
                    'description' => 'Orders across all statuses',
                ],
                [
                    'label' => 'Categories',
                    'value' => $this->countTable('categories'),
                    'icon' => 'bi-tags',
                    'variant' => 'info',
                    'description' => 'Catalog organization groups',
                ],
            ],
            'quick_actions' => [
                [
                    'label' => 'Manage Categories',
                    'description' => 'Create and organize product categories',
                    'path' => '/admin/categories',
                    'icon' => 'bi-tags',
                ],
                [
                    'label' => 'Manage Products',
                    'description' => 'Build and maintain the product catalog',
                    'path' => '/admin/products',
                    'icon' => 'bi-box-seam',
                ],
                [
                    'label' => 'Review Orders',
                    'description' => 'Monitor incoming customer orders',
                    'path' => '/admin/orders',
                    'icon' => 'bi-receipt',
                ],
            ],
            'recent_activity' => [],
            'system' => [
                'api_status' => 'Online',
                'environment' => app()->environment(),
            ],
        ];
    }

    private function countTable(string $table): int
    {
        if (! Schema::hasTable($table)) {
            return 0;
        }

        return DB::table($table)->count();
    }
}
