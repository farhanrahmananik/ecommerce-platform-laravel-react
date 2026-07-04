# Backend API – E-Commerce Platform

Laravel 12 REST API backend for the E-Commerce Platform.

See the [root project README](../README.md) for complete installation instructions, environment guidance, features, and repository-wide commands.

## Tech Summary

- Laravel 12
- PHP `^8.2`
- Laravel Sanctum
- PHPUnit
- Laravel Pint

## Architecture

The backend follows a layered Laravel API structure:

- API controllers handle HTTP concerns and delegate application work.
- Form Requests validate request payloads and listing filters.
- Services contain business and query logic.
- API Resources define JSON response shapes.
- Eloquent models and relationships represent application data.
- Laravel Sanctum provides cookie/session authentication for the first-party SPA.
- Custom admin middleware protects role-restricted API routes.
- Feature tests cover core customer, storefront, and administration flows.

## Common Commands

Run these commands from `backend/`:

```powershell
composer install
Copy-Item .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan serve
php artisan test
vendor\bin\pint --test
```

Product images use Laravel's public storage disk, so `php artisan storage:link` is required for local image URLs.

Refer to the [root README](../README.md) before setup for database and environment configuration details.
