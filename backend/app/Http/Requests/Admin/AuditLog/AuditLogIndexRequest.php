<?php

namespace App\Http\Requests\Admin\AuditLog;

use Illuminate\Foundation\Http\FormRequest;

class AuditLogIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['search' => ['nullable', 'string', 'max:255'], 'module' => ['nullable', 'string', 'max:100'], 'action' => ['nullable', 'string', 'max:100'], 'event' => ['nullable', 'string', 'max:100'], 'user_id' => ['nullable', 'integer', 'exists:users,id'], 'date_from' => ['nullable', 'date'], 'date_to' => ['nullable', 'date', 'after_or_equal:date_from'], 'per_page' => ['nullable', 'integer', 'between:1,100']];
    }
}
