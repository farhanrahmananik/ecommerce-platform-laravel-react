<?php

use App\Http\Controllers\Api\Account\ProductReviewController as AccountProductReviewController;
use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\Admin\CouponController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\OrderStatusController;
use App\Http\Controllers\Api\Admin\ProductController;
use App\Http\Controllers\Api\Admin\ProductImageController;
use App\Http\Controllers\Api\Admin\ProductReviewController as AdminProductReviewController;
use App\Http\Controllers\Api\Admin\StockController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Cart\CartController;
use App\Http\Controllers\Api\Cart\CartItemController;
use App\Http\Controllers\Api\Checkout\CheckoutController;
use App\Http\Controllers\Api\Coupon\CouponValidationController;
use App\Http\Controllers\Api\Order\OrderController;
use App\Http\Controllers\Api\Storefront\ProductReviewController as StorefrontProductReviewController;
use App\Http\Controllers\Api\Storefront\StorefrontCategoryController;
use App\Http\Controllers\Api\Storefront\StorefrontProductController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::get('/storefront/categories', [StorefrontCategoryController::class, 'index']);
Route::get('/storefront/products', [StorefrontProductController::class, 'index']);
Route::get('/storefront/products/{product:slug}/reviews', [StorefrontProductReviewController::class, 'index']);
Route::get('/storefront/products/{slug}', [StorefrontProductController::class, 'show']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart/items', [CartItemController::class, 'store']);
    Route::patch('/cart/items/{cartItem}', [CartItemController::class, 'update']);
    Route::delete('/cart/items/{cartItem}', [CartItemController::class, 'destroy']);
    Route::delete('/cart', [CartController::class, 'destroy']);

    Route::post('/checkout', [CheckoutController::class, 'store']);
    Route::post('/coupons/validate', CouponValidationController::class);

    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);

    Route::get('/account/reviews', [AccountProductReviewController::class, 'index']);
    Route::post('/storefront/products/{product:slug}/reviews', [AccountProductReviewController::class, 'store']);
    Route::match(['put', 'patch'], '/account/reviews/{productReview}', [AccountProductReviewController::class, 'update']);
    Route::delete('/account/reviews/{productReview}', [AccountProductReviewController::class, 'destroy']);

    Route::middleware('admin')->group(function (): void {
        Route::get('/admin/stock/products', [StockController::class, 'products']);
        Route::get('/admin/stock/products/{product}/movements', [StockController::class, 'movements']);
        Route::post('/admin/stock/products/{product}/adjust', [StockController::class, 'adjust']);
        Route::get('/admin/product-reviews', [AdminProductReviewController::class, 'index']);
        Route::get('/admin/product-reviews/{productReview}', [AdminProductReviewController::class, 'show']);
        Route::patch('/admin/product-reviews/{productReview}/moderate', [AdminProductReviewController::class, 'moderate']);
    });

    // TODO(Role & Permission Management): Add admin-role middleware after persisted role data exists.
    Route::get('/admin/dashboard/summary', DashboardController::class);
    Route::get('/admin/orders', [AdminOrderController::class, 'index']);
    Route::get('/admin/orders/{order}', [AdminOrderController::class, 'show']);
    Route::patch('/admin/orders/{order}/status', [OrderStatusController::class, 'update']);
    Route::apiResource('/admin/categories', CategoryController::class);
    Route::apiResource('/admin/coupons', CouponController::class);
    Route::apiResource('/admin/products', ProductController::class);
    Route::get('/admin/products/{product}/images', [ProductImageController::class, 'index']);
    Route::post('/admin/products/{product}/images', [ProductImageController::class, 'store']);
    Route::patch('/admin/products/{product}/images/{productImage}', [ProductImageController::class, 'update']);
    Route::delete('/admin/products/{product}/images/{productImage}', [ProductImageController::class, 'destroy']);
});
