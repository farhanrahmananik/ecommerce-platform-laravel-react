<?php

namespace App\Http\Requests\Admin;

use App\Models\ProductReview;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ModerateProductReviewRequest extends FormRequest
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
            'status' => [
                'required',
                'string',
                Rule::in([
                    ProductReview::STATUS_APPROVED,
                    ProductReview::STATUS_REJECTED,
                ]),
            ],
            'moderation_note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
