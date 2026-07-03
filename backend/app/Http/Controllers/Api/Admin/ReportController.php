<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Report\ReportDateRangeRequest;
use App\Http\Requests\Admin\Report\StockReportRequest;
use App\Http\Requests\Admin\Report\TopProductsReportRequest;
use App\Http\Resources\Admin\Report\ReportSummaryResource;
use App\Http\Resources\Admin\Report\SalesReportResource;
use App\Http\Resources\Admin\Report\StockReportResource;
use App\Http\Resources\Admin\Report\TopProductReportResource;
use App\Services\Admin\ReportService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ReportController extends Controller
{
    public function __construct(private readonly ReportService $service) {}

    public function summary(ReportDateRangeRequest $r): ReportSummaryResource
    {
        return new ReportSummaryResource($this->service->summary($r->validated()));
    }

    public function sales(ReportDateRangeRequest $r): AnonymousResourceCollection
    {
        return SalesReportResource::collection($this->service->sales($r->validated()));
    }

    public function topProducts(TopProductsReportRequest $r): AnonymousResourceCollection
    {
        return TopProductReportResource::collection($this->service->topProducts($r->validated()));
    }

    public function stock(StockReportRequest $r): AnonymousResourceCollection
    {
        return StockReportResource::collection($this->service->stock($r->validated()));
    }
}
