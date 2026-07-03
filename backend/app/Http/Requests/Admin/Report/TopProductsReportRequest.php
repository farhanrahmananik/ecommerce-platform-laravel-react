<?php

namespace App\Http\Requests\Admin\Report;

class TopProductsReportRequest extends ReportDateRangeRequest
{
    public function rules(): array
    {
        return [...parent::rules(), 'limit' => ['nullable', 'integer', 'between:1,50']];
    }
}
