<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateProductRequest extends FormRequest
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
        $product = $this->route('product');
        $salePriceRules = ['nullable', 'numeric', 'min:0'];

        if ($this->exists('price')) {
            $salePriceRules[] = 'lte:price';
        }

        return [
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('products', 'slug')->ignore($product),
            ],
            'sku' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('products', 'sku')->ignore($product),
            ],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'sale_price' => $salePriceRules,
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'is_featured' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Get the after-validation callbacks for the request.
     *
     * @return array<callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (! $this->exists('sale_price') && ! $this->exists('price')) {
                    return;
                }

                $product = $this->route('product');
                $salePrice = $this->exists('sale_price')
                    ? $this->input('sale_price')
                    : $product->sale_price;
                $price = $this->exists('price')
                    ? $this->input('price')
                    : $product->price;

                if (
                    $salePrice !== null
                    && is_numeric($salePrice)
                    && is_numeric($price)
                    && (float) $salePrice > (float) $price
                    && ! $validator->errors()->has('sale_price')
                ) {
                    $validator->errors()->add(
                        'sale_price',
                        'The sale price field must be less than or equal to the price field.',
                    );
                }
            },
        ];
    }
}
