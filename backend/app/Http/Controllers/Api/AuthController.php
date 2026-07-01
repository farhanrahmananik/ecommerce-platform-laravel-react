<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\Auth\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request, AuthService $authService): JsonResponse
    {
        $user = $authService->register($request->validated());

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Registration successful.',
            'data' => [
                'user' => new UserResource($user),
            ],
        ], 201);
    }

    public function login(LoginRequest $request, AuthService $authService): JsonResponse
    {
        if (! $authService->attemptLogin($request->validated())) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $request->session()->regenerate();

        return response()->json([
            'message' => 'Login successful.',
            'data' => [
                'user' => new UserResource($request->user()),
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => [
                'user' => new UserResource($request->user()),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logout successful.',
        ]);
    }
}
