<?php

namespace App\Services\Admin;

use App\Models\AuditLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class AuditLogService
{
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        $search = trim((string) ($filters['search'] ?? ''));

        return AuditLog::query()->with('user')->when($search !== '', fn (Builder $q) => $q->where(fn (Builder $q) => $q->where('description', 'like', "%{$search}%")->orWhere('module', 'like', "%{$search}%")->orWhere('action', 'like', "%{$search}%")->orWhere('event', 'like', "%{$search}%")->orWhere('auditable_type', 'like', "%{$search}%")->orWhere('ip_address', 'like', "%{$search}%")->orWhereHas('user', fn (Builder $q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))))->when($filters['module'] ?? null, fn (Builder $q, $v) => $q->where('module', $v))->when($filters['action'] ?? null, fn (Builder $q, $v) => $q->where('action', $v))->when($filters['event'] ?? null, fn (Builder $q, $v) => $q->where('event', $v))->when($filters['user_id'] ?? null, fn (Builder $q, $v) => $q->where('user_id', $v))->when($filters['date_from'] ?? null, fn (Builder $q, $v) => $q->whereDate('created_at', '>=', $v))->when($filters['date_to'] ?? null, fn (Builder $q, $v) => $q->whereDate('created_at', '<=', $v))->latest()->paginate(min(max((int) ($filters['per_page'] ?? 20), 1), 100))->withQueryString();
    }

    public function find(AuditLog $auditLog): AuditLog
    {
        return $auditLog->load('user');
    }

    public function record(array $data): AuditLog
    {
        if (app()->bound('request')) {
            $request = request();

            $data['user_id'] ??= $request->user()?->getKey();
            $data['ip_address'] ??= $request->ip();
            $data['user_agent'] ??= $request->userAgent();
        }

        return AuditLog::query()->create($data)->load('user');
    }
}
