# E-Commerce Platform – Laravel React

![Laravel 12](https://img.shields.io/badge/Laravel-12-FF2D20?logo=laravel&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111827)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Bootstrap 5](https://img.shields.io/badge/Bootstrap-5-7952B3?logo=bootstrap&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-156%20passing-16A34A)
![Portfolio Project](https://img.shields.io/badge/Portfolio-Project-0F766E)

A production-style full-stack e-commerce platform built with a Laravel API backend and a responsive React frontend. The project covers customer shopping flows, operational admin tools, inventory workflows, reporting, auditability, and a tested Sanctum SPA authentication foundation.

## Screenshots

Screenshots will be added in a future documentation polish step. No placeholder image paths are included until the final assets are available.

## Project Overview

The application is organized as two focused applications in one repository:

- Laravel exposes public storefront, authenticated customer, and role-protected admin APIs.
- React provides the storefront, account experience, cart and checkout flows, and the admin workspace.
- Laravel Sanctum authenticates the first-party SPA with session cookies and CSRF protection.
- Service classes, validated requests, API Resources, route guards, and reusable state providers keep responsibilities explicit.

Customers can browse products, review product details, manage a cart, apply coupons, complete cash-on-delivery checkout, view orders, and submit verified-purchase reviews. Admin-capable users can manage the catalog, images, inventory, coupons, orders, reviews, reports, and audit history.

## Key Features

### Storefront

- Public category and product listing with search, category, featured, sorting, and pagination filters
- Product details with responsive image galleries, pricing, inventory state, and approved review summaries
- Polished loading, error, empty, and responsive mobile states

### Customer

- Registration, login, session restoration, logout, and friendly authentication recovery states
- Authenticated cart with stock-aware quantity validation
- Checkout with shipping and billing details, cash on delivery, and coupon application
- Order history and detailed order snapshots
- Verified-purchase product review creation, editing, and deletion

### Admin

- Role-protected dashboard and admin workspace
- Category, product, and product-image management
- Stock adjustment and stock-movement history
- Coupon management and redemption-aware checkout integration
- Order search, filtering, details, and controlled status transitions
- Product-review moderation
- Sales, top-product, summary, and stock reports
- Filterable audit-log history with before/after values and metadata

### Operations and Quality

- Transactions and row locking around sensitive cart, checkout, stock, coupon, review, and order workflows
- Audit-log integration for important administrative and customer actions
- Backend feature regression coverage across authentication, authorization, catalog, commerce, and operations
- Responsive UI, accessibility basics, validation feedback, and production build verification

## User Roles

| Display role | Implemented value | Access summary |
|---|---|---|
| Super Admin | `super_admin` | Admin workspace and protected admin APIs |
| Store Manager | `store_manager` | Admin workspace and protected admin APIs |
| Admin | `admin` | Admin workspace and protected admin APIs |
| Customer | `customer` | Storefront and authenticated customer features |

The current application uses a role field and custom admin middleware. It does not claim a separate, fine-grained permissions system.

## Tech Stack

| Area | Technologies |
|---|---|
| Backend | PHP `^8.2`, Laravel `12.62.0`, Laravel Sanctum `4.3.2`, Eloquent ORM |
| Frontend | React `^19.2.7`, React Router `^7.18.1`, Vite `^8.1.1`, Axios `^1.18.1` |
| UI | Bootstrap `^5.3.8`, Bootstrap Icons `^1.13.1`, SweetAlert2 `^11.26.25`, custom CSS |
| Database | SQLite by default for local setup; MySQL is supported and configurable |
| Quality | PHPUnit `11.5.55`, Laravel Pint `1.29.3`, ESLint 10, Vite production build |

## Architecture Overview

### Backend

- Thin API controllers delegate business and query behavior.
- Form Requests validate mutation payloads and listing filters.
- Service classes coordinate business rules, transactions, and persistence.
- API Resources and Resource Collections provide stable JSON response shapes.
- Eloquent relationships and targeted eager loading support predictable queries.
- Transactions and row locks protect concurrent commerce operations.
- Sanctum provides cookie/session authentication for the first-party SPA.
- `auth:sanctum` and custom `admin` middleware protect customer and admin boundaries.
- Audit-log services capture important state changes without duplicating controller logic.

### Frontend

- A central React Router configuration defines public, guest-only, customer, and admin routes.
- Route guards handle authentication, admin roles, and session-bootstrap failures.
- One Axios client provides the API base URL, credentials, and XSRF support.
- Service modules isolate API calls from page components.
- Auth and cart contexts expose reusable state through dedicated hooks.
- Pages provide field validation, action states, loading feedback, recoverable errors, and intentional empty states.
- Bootstrap 5 is extended with custom portfolio-oriented styling rather than used as an unmodified theme.

## Repository Structure

```text
.
├── backend/     # Laravel 12 API application
├── frontend/    # React and Vite SPA
├── docs/        # Architecture, database-reference, and UI documentation
└── README.md
```

## Installation and Local Setup

### Requirements

- PHP 8.2 or newer
- Composer
- Node.js and npm
- SQLite, or a configured MySQL database

Run the backend and frontend in separate PowerShell terminals.

### Backend

From the repository root:

```powershell
cd backend
composer install
Copy-Item .env.example .env
php artisan key:generate
```

The example environment defaults to SQLite. Ensure the database file exists if your Laravel setup requires it before migration:

```powershell
if (-not (Test-Path database/database.sqlite)) {
    New-Item -ItemType File database/database.sqlite
}
```

Complete the backend setup and start the API:

```powershell
php artisan migrate
php artisan storage:link
php artisan serve
```

The storage link is required for product images stored on Laravel's public disk.

#### Optional MySQL configuration

To use MySQL instead of SQLite, update `backend/.env` before running migrations:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ecommerce_platform
DB_USERNAME=root
DB_PASSWORD=
```

Create the database separately, then run `php artisan migrate`.

### Frontend

From the repository root in a second terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Expected local URLs:

- Backend API: `http://localhost:8000`
- Frontend SPA: `http://localhost:5173`

## Environment Variables

Important backend variables in `backend/.env`:

| Variable | Purpose |
|---|---|
| `APP_URL` | Laravel application URL, normally `http://localhost:8000` locally |
| `FRONTEND_URL` | Allowed first-party frontend origin |
| `SANCTUM_STATEFUL_DOMAINS` | Hosts that may use Sanctum's stateful SPA authentication |
| `DB_CONNECTION` | Database driver, with SQLite as the example default |
| `SESSION_DRIVER` | Session storage driver; the example uses `database` |
| `SESSION_DOMAIN` | Cookie domain configuration; `null` is suitable for the documented local setup |

Important frontend variable in `frontend/.env`:

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Laravel origin used by the shared Axios client |

Never commit real secrets. Production environments should use production origins, secure cookie settings, an appropriate database, and `APP_DEBUG=false`.

## API and Authentication Summary

- Registration and login are public entry points.
- Public storefront endpoints expose active categories, visible products, product details, and approved reviews.
- Authenticated customer endpoints cover the current user, logout, cart, checkout, coupon validation, orders, and customer reviews.
- Admin endpoints cover dashboard, catalog, images, stock, coupons, orders, moderation, reports, and audit logs.
- Admin endpoints require both `auth:sanctum` and the custom `admin` middleware.
- Authentication is session/cookie based; login and registration do not return personal access tokens.

## Demo Credentials

No public demo credentials are committed by default. Configure local users through registration, database seeders, or manual admin setup as needed.

Do not reuse local demonstration credentials in production.

## Common Commands

### Backend

Run from `backend/`:

```powershell
php artisan serve
php artisan test
composer test
vendor\bin\pint --test
php artisan route:list
```

### Frontend

Run from `frontend/`:

```powershell
npm run dev
npm run lint
npm run build
npm run preview
```

## Testing and Quality Status

Latest verified project checks:

- Backend: **156 tests passed with 808 assertions**
- Frontend ESLint: **passed**
- Frontend production build: **passed**
- `git diff --check`: **passed**
- UI polish and responsive/mobile QA: **completed**

The backend suite is primarily feature-oriented and covers authentication, admin authorization, request validation, storefront behavior, cart, checkout, coupons, orders, reviews, stock, reports, and audit logs.

## Known Non-Blocking Warning

The Vite production build currently reports a chunk-size warning because the main JavaScript bundle is approximately 645 kB after minification, above Vite's 500 kB warning threshold. The production build still completes successfully.

A future optimization pass can introduce route-level code splitting and dynamic imports without changing application behavior.

## Documentation

### Project documentation

- [Folder structure](docs/folder-structure.md)
- [UI polish checklist](docs/ui-polish/ui-polish-checklist.md)

### Database design references

Some database documents describe the planned architecture and may be broader than the current implemented schema. Treat them as design and planning references, not as a complete as-built schema.

- [Database design](docs/database/database-design.md)
- [Schema blueprint](docs/database/schema-blueprint.md)
- [Relationships](docs/database/relationships.md)
- [Indexes and constraints](docs/database/indexes-and-constraints.md)
- [Entity relationship diagrams](docs/database/erd.md)
- [Migration plan](docs/database/migration-plan.md)

## Final Validation Checklist

From the repository root:

```powershell
git diff --check

cd backend
php artisan test

cd ..\frontend
npm run lint
npm run build
```

Before publishing documentation, also verify local environment values, relative links, Mermaid rendering, and the absence of credentials or secrets.

## Project Status

This is a completed portfolio project covering the planned e-commerce, administration, UI polish, and testing scopes. The active repository scope is GitHub documentation.

The project is not presented as deployed, and no repository-wide license is claimed without a root license file.
