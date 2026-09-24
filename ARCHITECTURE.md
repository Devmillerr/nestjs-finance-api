# FinanceApi V3 — Arquitectura

## Decisiones principales

| Decisión | Elegida | Razón |
|---|---|---|
| Framework backend | NestJS 10 (no 11/12) | Estable, ampliamente documentado, compatible con el resto del ecosistema (Prisma, Passport) |
| Workspace | Monorepo (`apps/api`, `apps/web`) | API y frontend en un mismo repositorio, sin la complejidad de Nx/Turborepo |
| Auth | JWT access + refresh, rotación de refresh token con detección de reuso | Revocable, auditable, sin infra adicional (Redis) |
| Persistencia de refresh tokens | Tabla `refresh_tokens` en Postgres (se guarda el hash, no el token) | La detección de reuso revoca todas las sesiones si se detecta robo |
| Dinero | Enteros en centavos (`priceCents`, `totalCents`, etc.) | Cero riesgo de error de redondeo binario; toda la aritmética de dinero es entera |
| ORM | Prisma 5.x | Tipado, migraciones, bien integrado con NestJS 10 |

## Núcleo del backend

- `prisma/schema.prisma`: índices en todas las FKs, dinero en centavos, timestamps consistentes, `deletedAt` (soft delete) en los 4 modelos financieros primarios (purchases, invoices, budgets, service_contracts) y el modelo `RefreshToken`.
- `PrismaService` / `PrismaModule`: un único `PrismaClient` para toda la app.
- `AuthModule`: `register`, `login`, `refresh` (con rotación + detección de reuso), `logout`, login con Google.
- RBAC: `@Roles()`, `@RequirePermissions()`, `RolesGuard`, `PermissionsGuard`, aplicados **globalmente** con default-deny (`JwtAuthGuard` global + `@Public()` como opt-out explícito). En V2 todos los endpoints eran públicos por omisión; V3 invierte esa regla.
- `main.ts` endurecido: helmet, CORS explícito por env, `ValidationPipe` global con `whitelist`/`forbidNonWhitelisted`, API versionada (`/api/v1`, con `/health` excluido a propósito).
- Rate limiting global (`@nestjs/throttler`) + límite más estricto en `/auth/login`.

## Módulos de dominio

### Purchases

- Creación transaccional (`$transaction`): resolver precios, calcular total y crear compra+líneas es atómico — si algo falla a mitad de camino, no queda una compra huérfana ni líneas sin compra.
- Snapshot de precio: `unitPriceCents` se congela en la línea de compra al momento de comprar, no se recalcula si el producto cambia de precio después.
- `clientId` nunca viaja en el body del POST — se toma del usuario autenticado. Un usuario no puede crear una compra a nombre de otro.
- Listado con scope automático: un usuario normal solo ve sus propias compras; ADMIN/OWNER ven todas (o filtran por `?clientId=`).
- Cambio de estado de pago y borrado (soft delete) son operaciones exclusivas de ADMIN/OWNER.

### Budgets

- Regla de línea (producto de catálogo O ítem libre) validada explícitamente en el service — nunca las dos combinadas de forma ambigua, nunca ninguna.
- La actualización de líneas es un reemplazo completo transaccional (borra + crea dentro del mismo `$transaction`), no un parche línea por línea — más simple y predecible para editar una propuesta.
- A diferencia de Purchases, el propio dueño SÍ puede editar/borrar su presupuesto (no tiene estado de pago que proteger), vía `OwnershipGuard` sin restricción adicional de rol.

### Invoices

- Sin `totalCents` almacenado: el total se calcula desde `lines` + `charges` en cada lectura (`computeTotals`). Una factura puede recibir cargos posteriores a la emisión, y guardar un total redundante introduciría riesgo de desincronización.
- Cada línea referencia como mucho **uno** de producto/servicio/contrato de servicio (o ninguno, ítem libre) — validado explícitamente, rechaza referencias combinadas.
- `POST /invoices` y las mutaciones (estado, cargos, borrado) son exclusivas de ADMIN/OWNER — el negocio emite la factura, no el cliente. El cliente solo lee su propia factura vía `OwnershipGuard`.
- Los cargos posteriores (mora, ajustes) se agregan como registros nuevos en `InvoiceCharge`, nunca modificando las líneas originales — preserva el snapshot de lo facturado.

### Services + ServiceContracts

- `ServicesController`: catálogo, mismo patrón que Products (lectura para cualquier autenticado, mutaciones ADMIN/OWNER).
- `ServiceContractsController`: separado del catálogo — un contrato puede referenciar un servicio del catálogo (hereda `name`/`priceCents` si no se sobreescriben) o ser un contrato a medida sin entrada en el catálogo.
- Asignaciones de equipo (`ServiceAssignment`) anidadas bajo el contrato (`POST/DELETE /service-contracts/:id/assignments`) — no son un recurso de primer nivel.
- Emisión y mutaciones de contrato exclusivas de ADMIN/OWNER; el cliente solo lee su propio contrato vía `OwnershipGuard`.

## Aspectos transversales

### Idempotencia en creación de pagos/compras

- Header opcional `Idempotency-Key` en `POST /purchases` y `POST /invoices` (los dos endpoints de creación financiera crítica).
- `IdempotencyInterceptor`: la primera llamada con una key ejecuta y guarda la respuesta; un reintento con la **misma key + mismo payload** devuelve la respuesta guardada sin re-ejecutar la creación; la misma key con un **payload distinto** es un `409 Conflict` explícito.
- Tabla `idempotency_keys` (migración `prisma/migrations/20260831000000_add_idempotency_keys/`). Las keys huérfanas en estado `PENDING` se limpian periódicamente (`IdempotencyReaperTask`).
- Sin el header, el endpoint se comporta exactamente igual — es opt-in.

### Logging estructurado (pino)

- `nestjs-pino` reemplaza el logger default de Nest globalmente (`app.useLogger`) — cualquier `new Logger(name)` existente pasa a loguear vía pino.
- Correlación por `requestId`: cada request genera o hereda un id (`genReqId`), y todos los logs de esa petición —incluido el del `AllExceptionsFilter` en un 500— comparten ese id.
- Redacción automática: `authorization`, `cookie`, `password`, `passwordHash`, `refreshToken` nunca aparecen en un log.
- Formato dual por `NODE_ENV`: `pino-pretty` legible en desarrollo, JSON crudo en producción.

### Documentación OpenAPI/Swagger

- Disponible en `/docs` una vez levantado el server (`http://localhost:5050/docs`).
- Plugin de CLI de Nest (`@nestjs/swagger` en `nest-cli.json`): infiere los schemas de los DTOs automáticamente desde los tipos y decorators de `class-validator`.
- `@ApiBearerAuth('access-token')` en todos los controllers protegidos; el botón "Authorize" de Swagger UI permite probar los endpoints protegidos con un JWT.
- En un despliegue de producción real lo estándar es proteger o deshabilitar `/docs`; aquí queda expuesto a propósito porque la documentación viva forma parte de lo que el proyecto muestra.

### Testing y CI

- Tests de dominio (no boilerplate) con Prisma mockeado: `AuthService` (registro, login, rotación de refresh token + detección de reuso), `RolesGuard`/`PermissionsGuard`/`OwnershipGuard`, `PurchasesService` (snapshot de precio, cálculo de total, rollback si un producto no existe), `BudgetsService`, `InvoicesService`, `UsersService`, `DashboardService`, `IdempotencyInterceptor`, entre otros.
- CI (`.github/workflows/ci.yml`): lint + build + test en cada push/PR. No necesita credenciales reales de base de datos — `prisma generate` solo lee el schema y los tests mockean Prisma por completo.
- Auditoría de dependencias: ver `SECURITY.md`.

## Base de datos

PostgreSQL gestionado en Supabase. RLS habilitado sin policies en todas las tablas (deny-by-default): bloquea la API REST autogenerada de Supabase, ya que la app solo se conecta vía Prisma con su propia connection string.

### Pooler vs. conexión directa

`DATABASE_URL` apunta al *transaction pooler* de Supabase (puerto 6543, pgbouncer), que no soporta los advisory locks ni prepared statements que `prisma migrate` necesita internamente — con esa URL las migraciones se cuelgan sin error. Por eso `schema.prisma` declara `directUrl`:

- `DATABASE_URL` → pooler (puerto 6543, `?pgbouncer=true`), usado en runtime.
- `DIRECT_URL` → mismo host, puerto 5432, sin `pgbouncer=true`, usado por `prisma migrate` / `prisma db seed`.

Ambas se obtienen en **Supabase Dashboard → Project Settings → Database → Connection string → URI**. Ver `apps/api/.env.example`.

### Configuración local

```bash
cd apps/api
cp .env.example .env          # completar DATABASE_URL, DIRECT_URL, secretos JWT, etc.
npm install
npx prisma generate
npx prisma migrate deploy     # aplica las migraciones sobre una base nueva
npx prisma db seed            # catálogo de permisos + usuario OWNER inicial
npm run build
npm test
npm run start:dev
```

## Frontend (`apps/web`)

**Decisiones:** Next.js 16 (App Router), JWT con access token en memoria + refresh token en cookie httpOnly vía BFF (route handlers de Next), shadcn/ui como sistema de componentes.

- **BFF de auth:** `/api/auth/login`, `/api/auth/google`, `/api/auth/refresh`, `/api/auth/logout` — el refresh token nunca llega al navegador como JSON, vive solo en una cookie httpOnly; el access token vuelve al cliente y se guarda en memoria (`AuthContext`, nunca `localStorage`).
- `AuthContext`: refresh silencioso al montar la app (recupera la sesión desde la cookie) y `authFetch`, que reintenta una vez tras un 401 refrescando el token.
- Dashboard con datos reales de la API (`GET /dashboard/stats`): si un dato no existe en el backend, no se muestra, en vez de inventarlo.
- `/register` llama directo a `POST /auth/register` (público, sin tokens en la respuesta) y auto-loguea tras crear la cuenta.
- Command palette (`⌘K`/`Ctrl+K`), skeletons de carga, error boundaries y `not-found` por sección, tema claro/oscuro y navegación mobile.
- **Invoices:** selector de cliente (`GET /users`, admin-only); cada línea tiene un toggle "Del catálogo" / "Ítem libre" que refleja la misma regla de exclusión del backend; el detalle muestra subtotal + cargos = total calculado por el backend, y permite agregar cargos post-emisión.
- **Budgets:** el dueño (no solo ADMIN) puede editar y borrar; edición inline con reemplazo completo de líneas. El editor de líneas (`components/budget-line-editor.tsx`) es compartido entre alta y edición.
- **Services / Products / Purchases / Service Contracts:** list/detalle/alta/edición/borrado según los permisos del backend.
- **Users:** sin página de alta — los usuarios se registran vía `/auth/register`. Detalle con edición de perfil, desactivación de cuenta (admin-only) y gestión de rol y permisos.
- La UI nunca es la barrera de seguridad real: el backend responde 403 si una acción no corresponde.
