<?php

namespace App\Services\Admin;

use App\Models\Coupon;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class CouponService
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    /**
     * @param  array<string, mixed>  $filters
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = Coupon::query()
            ->with('createdBy')
            ->withCount('redemptions');

        $this->applySearch($query, $filters['search'] ?? null);
        $this->applyStatus($query, $filters['status'] ?? null);
        $this->applyType($query, $filters['type'] ?? null);

        $perPage = min(max((int) ($filters['per_page'] ?? 15), 1), 50);

        return $query
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $admin): Coupon
    {
        $data = $this->prepareData($data);
        $data['created_by_id'] = $admin->getKey();

        $coupon = Coupon::query()
            ->create($data)
            ->load('createdBy')
            ->loadCount('redemptions');

        $this->auditLogService->record([
            'module' => 'coupons',
            'action' => 'created',
            'event' => 'coupon.created',
            'auditable_type' => $coupon->getMorphClass(),
            'auditable_id' => $coupon->getKey(),
            'description' => "Coupon {$coupon->code} was created.",
            'new_values' => $coupon->getAttributes(),
        ]);

        return $coupon;
    }

    public function show(Coupon $coupon): Coupon
    {
        return $coupon->load('createdBy')->loadCount('redemptions');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Coupon $coupon, array $data): Coupon
    {
        $oldValues = $coupon->getAttributes();
        $coupon->update($this->prepareData($data));

        $coupon = $this->show($coupon->refresh());

        $this->auditLogService->record([
            'module' => 'coupons',
            'action' => 'updated',
            'event' => 'coupon.updated',
            'auditable_type' => $coupon->getMorphClass(),
            'auditable_id' => $coupon->getKey(),
            'description' => "Coupon {$coupon->code} was updated.",
            'old_values' => $oldValues,
            'new_values' => $coupon->getAttributes(),
        ]);

        return $coupon;
    }

    public function delete(Coupon $coupon): void
    {
        $oldValues = $coupon->getAttributes();
        $coupon->delete();

        $this->auditLogService->record([
            'module' => 'coupons',
            'action' => 'deleted',
            'event' => 'coupon.deleted',
            'auditable_type' => $coupon->getMorphClass(),
            'auditable_id' => $coupon->getKey(),
            'description' => "Coupon {$coupon->code} was deleted.",
            'old_values' => $oldValues,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function prepareData(array $data): array
    {
        if (array_key_exists('code', $data)) {
            $data['code'] = strtoupper(trim((string) $data['code']));
        }

        if (
            array_key_exists('min_order_amount', $data)
            && $data['min_order_amount'] === null
        ) {
            $data['min_order_amount'] = 0;
        }

        return $data;
    }

    private function applySearch(Builder $query, mixed $search): void
    {
        if (! is_string($search) || blank($search)) {
            return;
        }

        $query->where(function (Builder $query) use ($search): void {
            $query
                ->where('code', 'like', "%{$search}%")
                ->orWhere('name', 'like', "%{$search}%");
        });
    }

    private function applyStatus(Builder $query, mixed $status): void
    {
        if (! is_string($status) || in_array($status, ['', 'all'], true)) {
            return;
        }

        if (in_array($status, ['active', 'inactive'], true)) {
            $query->where('is_active', $status === 'active');
        }
    }

    private function applyType(Builder $query, mixed $type): void
    {
        if (! is_string($type) || in_array($type, ['', 'all'], true)) {
            return;
        }

        if (in_array($type, ['fixed', 'percentage'], true)) {
            $query->where('type', $type);
        }
    }
}
