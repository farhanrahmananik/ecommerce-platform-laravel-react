# Folder Structure

This document is a high-level guide to the completed project structure. It highlights the main areas of responsibility rather than providing a complete file-by-file inventory.

## Repository Root

```text
.
├── backend/     # Laravel 12 REST API
├── frontend/    # React and Vite SPA
├── docs/        # Project and design documentation
└── README.md    # Primary project overview and setup guide
```

## Backend

The `backend/` directory contains the Laravel API application.

| Path | Purpose |
|---|---|
| `app/Http/Controllers/Api/` | Public, customer, and admin API controllers |
| `app/Http/Requests/` | Form Requests for payload and query validation |
| `app/Http/Resources/` | API Resources and response transformation |
| `app/Models/` | Eloquent models and relationships |
| `app/Services/` | Business logic, transactions, and query coordination |
| `database/migrations/` | Current implemented database schema |
| `database/seeders/` | Local database seeding entry points |
| `routes/api.php` | Public, authenticated customer, and protected admin routes |
| `tests/Feature/` | Feature and regression tests for API behavior |

## Frontend

The `frontend/` directory contains the React SPA.

| Path | Purpose |
|---|---|
| `src/components/` | Reusable account, admin, common, review, and storefront components |
| `src/context/` and `src/contexts/` | Authentication and cart state providers |
| `src/hooks/` | Context access and reusable state hooks |
| `src/layouts/` | Storefront, authentication, and admin layout shells |
| `src/pages/` | Storefront, customer, authentication, cart, checkout, and admin pages |
| `src/router/` | Central React Router configuration |
| `src/services/` | Shared Axios client and feature-oriented API services |
| `src/index.css`, `src/App.css`, `src/assets/styles/` | Global and administration-specific styling |

## Documentation

| Path | Purpose |
|---|---|
| `docs/database/` | Database design and planning references |
| `docs/ui-polish/` | Completed UI polish scope checklist |

The Laravel migrations are the source of truth for the currently implemented schema. Some documents under `docs/database/` describe a broader planned architecture and should be read as design references.

For setup instructions and the complete project overview, see the [root README](../README.md).
