<?php

namespace App\Http\Requests\Storefront;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListStorefrontProductsRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:120'],
            'featured' => ['nullable', 'boolean'],
            'sort' => [
                'nullable',
                Rule::in(['latest', 'price_asc', 'price_desc', 'name_asc']),
            ],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:48'],
        ];
    }
}
