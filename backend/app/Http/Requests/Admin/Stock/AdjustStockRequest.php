<?php

namespace App\Http\Requests\Admin\Stock;

use Illuminate\Foundation\Http\FormRequest;

class AdjustStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['quantity' => ['required', 'integer', 'min:0'], 'reason' => ['nullable', 'string', 'max:1000']];
    }
}
