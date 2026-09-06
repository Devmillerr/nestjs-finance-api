# FinanceApi V3

A production-oriented financial management REST API built with **NestJS**, **PostgreSQL** (via **Prisma**), and **Supabase**. Handles clients, product catalog, purchases, budgets, invoices, and service contracts — with JWT authentication, role/permission-based access control, and resource ownership enforcement.

This is a V2 → V3 rewrite. The original V2 (Express + TypeScript) had no real authentication in front of any endpoint, stored money as floating point, and had zero test coverage. The full before/after audit and the reasoning behind every architectural decision live in [`ARCHITECTURE.md`](./ARCHITECTURE.md) — this README is the entry point; that file is the paper trail.

## Stack

| Layer | Choice | Why (short version — full reasoning in ARCHITECTURE.md) |
|---|---|---|
| Framework | NestJS 10 | Dependency injection, guards/interceptors as first-class citizens, structure enforced by the framework rather than convention |
| Database | PostgreSQL (Supabase) | Relational integrity for financial data; Supabase for managed hosting + RLS |
| ORM | Prisma 5 | Type-safe queries, migrations, mature NestJS integration |
| Auth | JWT access + refresh, with rotation and reuse detection | Stateless access tokens, revocable sessions, standard defensible pattern |
| Validation | class-validator / class-transformer | Declarative DTOs, integrated into Nest's request pipeline |
| Logging | Pino (`nestjs-pino`) | Structured JSON logs, per-request correlation ID, automatic secret redaction |
| API docs | OpenAPI/Swagger | Auto-generated from DTOs via the Nest CLI plugin, live at `/docs` |
| Testing | Jest | Unit tests on business logic with a mocked Prisma layer, no real DB needed |

## Architecture highlights

- **Money is stored as integers (cents)**, never floats — eliminates binary rounding error class of bugs entirely.
- **Default-deny authorization**: every endpoint requires a valid JWT unless explicitly marked `@Public()`. RBAC (`@Roles()`) and fine-grained permissions (`@RequirePermissions()`) stack on top; resource ownership (`OwnershipGuard`) is enforced separately from role, so a `USER` can only read/act on their own purchases, budgets, and invoices. `GET /auth/me` exposes the current role/permissions to the frontend (never trusted from the JWT payload — re-resolved from the DB on every request, same as authorization itself); `PATCH /users/:id/role` (OWNER-only) and `POST`/`DELETE /users/:id/permissions` (ADMIN/OWNER) manage them.
- **Refresh token rotation with reuse detection**: every refresh issues a new token and invalidates the old one. If an already-rotated token is presented again (a strong signal of token theft), every active session for that user is revoked.
- **Idempotency keys** on the two payment-critical write endpoints (`POST /purchases`, `POST /invoices`): an optional `Idempotency-Key` header guarantees a network retry never creates a duplicate financial record.
- **Snapshot pattern** on purchase/invoice line items: the price is frozen at transaction time and never recalculated if the underlying product's price changes later — required for financial record immutability.
- **All multi-table writes run inside a Prisma `$transaction`** — a partial failure never leaves an orphaned record.

## Project structure

```
apps/api/src/
  auth/              JWT issuance, refresh rotation, register/login
  users/              user profile CRUD, ownership-scoped
  products/            product catalog (admin-managed)
  purchases/            client purchases (transactional, snapshot pricing)
  budgets/              client quotes (catalog reference or freeform line items)
  invoices/              billing documents (computed totals, post-issuance charges)
  services/              service catalog
  service-contracts/      per-client contracts + team assignments
  dashboard/            read-only aggregate stats (overdue invoices, client concentration, upcoming/recent activity) for the frontend overview page
  common/
    guards/            JwtAuthGuard, RolesGuard, PermissionsGuard, OwnershipGuard
    decorators/          @Public, @Roles, @RequirePermissions, @OwnedResource, @CurrentUser
    interceptors/        IdempotencyInterceptor
    tasks/              IdempotencyReaperTask (reaps orphaned PENDING idempotency keys on a cron)
    filters/            AllExceptionsFilter (single error response shape across the API)
  prisma/              PrismaService (single client instance for the whole app)

prisma/seed.ts          seeds the permission catalog + bootstrap OWNER user (see "Running locally")
```

## Running locally

```bash
cd apps/api
cp .env.example .env   # fill in DATABASE_URL, DIRECT_URL, JWT secrets, SEED_OWNER_EMAIL/PASSWORD — see .env.example for where to get them
npm install
npx prisma generate
npx prisma migrate deploy   # applies the schema to a fresh database — skip only if it's already up to date
npx prisma db seed          # seeds the permission catalog + a bootstrap OWNER user (required: there is no other way to create the first admin)
npm run build
npm test
npm run start:dev
```

API docs: `http://localhost:5050/docs`. Health check: `GET /health` (public, no auth).

## Testing

```bash
npm test              # unit tests, mocked Prisma — no database required
npm run test:cov       # with coverage
```

Tests focus on business logic that actually matters in a financial domain: refresh token rotation and reuse detection, price snapshot correctness, transactional rollback on invalid line items, and the RBAC/permission decision logic — not framework boilerplate.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs lint + build + unit tests on every push/PR. No real database credentials are needed in CI — `prisma generate` only reads the schema, and the test suite mocks the Prisma layer entirely.

## Security notes

- Passwords hashed with bcrypt (12 rounds); refresh tokens stored as SHA-256 hashes, never in plaintext.
- `helmet`, explicit CORS origin (no wildcard reflection), global `ValidationPipe` with `whitelist`/`forbidNonWhitelisted`, rate limiting (`@nestjs/throttler`, stricter on `/auth/login`).
- Row Level Security enabled (deny-by-default, no policies) on every table in Supabase — closes off the auto-generated PostgREST API as an attack surface, since this app only ever connects through Prisma with its own connection string.
- See `ARCHITECTURE.md` for the full audit of what V2 got wrong and how each issue was addressed.

## Status

Backend: feature-complete and connected to a real frontend. All domain modules (auth, users, products, purchases, budgets, invoices, services, service-contracts), RBAC/permission management, and a read-only dashboard-stats endpoint are implemented, tested, and verified end-to-end against a live database. Frontend: an active Next.js dashboard (`apps/web`) already consumes this API — CRUD flows, role-based navigation, and the overview dashboard are wired up and working. Full phase-by-phase log in `ARCHITECTURE.md`.
