# FinanceApi V3 — Web

Next.js 16 (App Router) dashboard for the FinanceApi V3 backend (`apps/api`).

- Auth via a small BFF (`app/api/auth/*` route handlers): the refresh token lives only in an httpOnly cookie; the access token is kept in memory, never in `localStorage`.
- Email/password and Google sign-in.
- CRUD screens for products, services, purchases, budgets, invoices, service contracts and users, plus an overview dashboard backed by `GET /dashboard/stats`.
- UI built with shadcn/ui + Tailwind CSS, light/dark theme, command palette (`⌘K` / `Ctrl+K`).

See [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) for design details.

## Running locally

The API (`apps/api`) must be running first — see the root [`README.md`](../../README.md).

Create `apps/web/.env.local`:

```bash
# Backend URL used only by the BFF route handlers (never sent to the browser)
API_URL="http://localhost:5050/api/v1"

# Backend URL used by the browser for authenticated calls (must match CORS_ORIGIN on the API)
NEXT_PUBLIC_BACKEND_URL="http://localhost:5050/api/v1"

# Same value as GOOGLE_CLIENT_ID in apps/api/.env (not a secret)
NEXT_PUBLIC_GOOGLE_CLIENT_ID="replace-with-your-client-id.apps.googleusercontent.com"
```

Then:

```bash
cd apps/web
npm install
npm run dev     # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`.
