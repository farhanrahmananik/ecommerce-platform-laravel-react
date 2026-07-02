<?php

namespace App\Http\Requests\ProductReview;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProductReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'rating' => ['sometimes', 'required', 'integer', 'between:1,5'],
            'title' => ['sometimes', 'nullable', 'string', 'max:150'],
            'comment' => ['sometimes', 'required', 'string', 'min:10', 'max:3000'],
        ];
    }
}
