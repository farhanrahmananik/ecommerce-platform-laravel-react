<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\DashboardSummaryResource;
use App\Services\Admin\DashboardService;

class DashboardController extends Controller
{
    public function __invoke(DashboardService $dashboardService): DashboardSummaryResource
    {
        return new DashboardSummaryResource($dashboardService->getSummary());
    }
}
