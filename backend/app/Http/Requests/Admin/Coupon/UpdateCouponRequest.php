<?php

namespace App\Http\Requests\Admin\Coupon;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateCouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $coupon = $this->route('coupon');
        $expiresAtRules = ['nullable', 'date'];

        if ($this->exists('starts_at')) {
            $expiresAtRules[] = 'after_or_equal:starts_at';
        }

        return [
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('coupons', 'code')->ignore($coupon),
            ],
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'type' => ['sometimes', 'required', Rule::in(['fixed', 'percentage'])],
            'value' => ['sometimes', 'required', 'numeric', 'min:0.01'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0.01'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'usage_limit_per_user' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => $expiresAtRules,
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $coupon = $this->route('coupon');
                $type = $this->exists('type')
                    ? $this->input('type')
                    : $coupon->type;
                $value = $this->exists('value')
                    ? $this->input('value')
                    : $coupon->value;
                $startsAt = $this->exists('starts_at')
                    ? $this->input('starts_at')
                    : $coupon->starts_at;
                $expiresAt = $this->exists('expires_at')
                    ? $this->input('expires_at')
                    : $coupon->expires_at;

                if (
                    $type === 'percentage'
                    && is_numeric($value)
                    && (float) $value > 100
                    && ! $validator->errors()->has('value')
                ) {
                    $validator->errors()->add(
                        'value',
                        'The percentage coupon value must not be greater than 100.',
                    );
                }

                if (
                    $startsAt
                    && $expiresAt
                    && strtotime((string) $expiresAt) < strtotime((string) $startsAt)
                    && ! $validator->errors()->has('expires_at')
                ) {
                    $validator->errors()->add(
                        'expires_at',
                        'The expires at field must be a date after or equal to starts at.',
                    );
                }
            },
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge([
                'code' => strtoupper(trim((string) $this->input('code'))),
            ]);
        }
    }
}
