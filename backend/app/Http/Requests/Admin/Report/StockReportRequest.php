<?php

namespace App\Http\Requests\Admin\Report;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StockReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['status' => ['nullable', Rule::in(['in_stock', 'low_stock', 'out_of_stock'])], 'search' => ['nullable', 'string', 'max:100'], 'category_id' => ['nullable', 'integer', 'exists:categories,id']];
    }
}
