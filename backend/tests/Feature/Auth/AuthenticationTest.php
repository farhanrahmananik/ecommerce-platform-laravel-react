<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('sanctum.stateful', ['localhost:5173']);
        $this->withHeader('Origin', 'http://localhost:5173');
    }

    public function test_a_user_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Example Customer',
            'email' => 'customer@example.com',
            'password' => 'secure-password',
            'password_confirmation' => 'secure-password',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Registration successful.')
            ->assertJsonPath('data.user.name', 'Example Customer')
            ->assertJsonPath('data.user.email', 'customer@example.com')
            ->assertJsonPath('data.user.email_verified_at', null)
            ->assertJsonMissingPath('data.user.password');

        $user = User::query()->where('email', 'customer@example.com')->firstOrFail();

        $this->assertAuthenticatedAs($user);
        $this->assertTrue(Hash::check('secure-password', $user->password));
    }

    public function test_registration_returns_validation_errors_for_invalid_data(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => '',
            'email' => 'INVALID-EMAIL',
            'password' => 'short',
            'password_confirmation' => 'different',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);

        $this->assertDatabaseCount('users', 0);
        $this->assertGuest();
    }

    public function test_a_user_can_login_with_correct_credentials(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('correct-password'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'correct-password',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Login successful.')
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.email', $user->email)
            ->assertJsonMissingPath('data.user.password');

        $this->assertAuthenticatedAs($user);
    }

    public function test_login_fails_with_an_incorrect_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('correct-password'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email'])
            ->assertJsonPath('errors.email.0', 'The provided credentials are incorrect.');

        $this->assertGuest();
    }

    public function test_an_unauthenticated_user_cannot_access_the_current_user_endpoint(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_an_authenticated_user_can_access_the_current_user_endpoint(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user, 'web')
            ->getJson('/api/auth/me');

        $response
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.email', $user->email);
    }

    public function test_an_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user, 'web')
            ->postJson('/api/auth/logout');

        $response
            ->assertOk()
            ->assertExactJson([
                'message' => 'Logout successful.',
            ]);

        $this->assertGuest('web');
    }
}
