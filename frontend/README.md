# Frontend SPA – E-Commerce Platform

React and Vite single-page frontend for the E-Commerce Platform.

See the [root project README](../README.md) for complete installation instructions, environment guidance, features, and repository-wide commands.

## Tech Summary

- React 19
- Vite 8
- React Router
- Axios
- Bootstrap 5
- Bootstrap Icons
- SweetAlert2
- ESLint

## Architecture

The frontend is organized around:

- React Router configuration for public, guest-only, authenticated customer, and admin routes.
- Guest, authentication, and admin route guards.
- A shared Axios service layer with cookie and XSRF support.
- Auth and cart contexts exposed through dedicated hooks.
- Storefront, customer-account, and administration UI areas.
- Consistent loading, error, empty, action, and validation states.

## Environment

`VITE_API_BASE_URL` sets the Laravel backend origin used by the shared Axios client. The local example points to `http://localhost:8000`.

## Common Commands

Run these commands from `frontend/`:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
npm run lint
npm run build
npm run preview
```

The production build currently completes successfully with a non-blocking Vite warning because the main JavaScript chunk exceeds the default 500 kB warning threshold.

Refer to the [root README](../README.md) for the full local setup and quality-validation workflow.
