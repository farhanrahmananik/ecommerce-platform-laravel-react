<?php

namespace App\Http\Requests\Checkout;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreCheckoutRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'email', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:30'],
            'shipping_address_line1' => ['required', 'string', 'max:255'],
            'shipping_address_line2' => ['nullable', 'string', 'max:255'],
            'shipping_city' => ['required', 'string', 'max:100'],
            'shipping_state' => ['nullable', 'string', 'max:100'],
            'shipping_postal_code' => ['required', 'string', 'max:30'],
            'shipping_country' => ['required', 'string', 'max:100'],
            'billing_same_as_shipping' => ['required', 'boolean'],
            'billing_address_line1' => [
                'required_if:billing_same_as_shipping,false',
                'nullable',
                'string',
                'max:255',
            ],
            'billing_address_line2' => ['nullable', 'string', 'max:255'],
            'billing_city' => [
                'required_if:billing_same_as_shipping,false',
                'nullable',
                'string',
                'max:100',
            ],
            'billing_state' => ['nullable', 'string', 'max:100'],
            'billing_postal_code' => [
                'required_if:billing_same_as_shipping,false',
                'nullable',
                'string',
                'max:30',
            ],
            'billing_country' => [
                'required_if:billing_same_as_shipping,false',
                'nullable',
                'string',
                'max:100',
            ],
            'payment_method' => ['required', 'string', 'in:cash_on_delivery'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
