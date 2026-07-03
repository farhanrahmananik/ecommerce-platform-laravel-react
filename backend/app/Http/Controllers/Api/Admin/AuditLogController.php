<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AuditLog\AuditLogIndexRequest;
use App\Http\Resources\Admin\AuditLogResource;
use App\Models\AuditLog;
use App\Services\Admin\AuditLogService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AuditLogController extends Controller
{
    public function __construct(private readonly AuditLogService $service) {}

    public function index(AuditLogIndexRequest $request): AnonymousResourceCollection
    {
        return AuditLogResource::collection($this->service->paginate($request->validated()));
    }

    public function show(AuditLog $auditLog): AuditLogResource
    {
        return new AuditLogResource($this->service->find($auditLog));
    }
}
