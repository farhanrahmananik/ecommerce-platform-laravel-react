<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    /**
     * Register a new user.
     *
     * @param  array{name: string, email: string, password: string}  $data
     */
    public function register(array $data): User
    {
        return User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);
    }

    /**
     * Attempt to authenticate a user with the web guard.
     *
     * @param  array{email: string, password: string}  $credentials
     */
    public function attemptLogin(array $credentials): bool
    {
        return Auth::attempt($credentials);
    }
}
