<?php

use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\ProductController;
use App\Http\Controllers\Api\Admin\ProductImageController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // TODO(Role & Permission Management): Add admin-role middleware after persisted role data exists.
    Route::get('/admin/dashboard/summary', DashboardController::class);
    Route::apiResource('/admin/categories', CategoryController::class);
    Route::apiResource('/admin/products', ProductController::class);
    Route::get('/admin/products/{product}/images', [ProductImageController::class, 'index']);
    Route::post('/admin/products/{product}/images', [ProductImageController::class, 'store']);
    Route::patch('/admin/products/{product}/images/{productImage}', [ProductImageController::class, 'update']);
    Route::delete('/admin/products/{product}/images/{productImage}', [ProductImageController::class, 'destroy']);
});
