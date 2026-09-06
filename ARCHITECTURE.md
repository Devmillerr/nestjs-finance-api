# FinanceApi V3 — Arquitectura

## Decisiones cerradas (Fase 0)

| Decisión | Elegida | Razón |
|---|---|---|
| Framework backend | NestJS 10 (no 11/12) | Estable, ampliamente documentado, compatible con el resto del ecosistema (Prisma, Passport) |
| Workspace | Monorepo con pnpm workspaces (`apps/api`, `apps/web`, `packages/shared-types`) | Comparte contratos/DTOs entre API y frontend sin la complejidad de Nx/Turborepo |
| Auth | JWT access + refresh, rotación de refresh token con detección de reuso | Revocable, auditable, sin infra adicional (Redis) |
| Persistencia de refresh tokens | Tabla `refresh_tokens` en Postgres (se guarda el hash, no el token) | Estándar defendible en entrevista; reuse detection revoca todas las sesiones si se detecta robo |
| Dinero | Enteros en centavos (`priceCents`, `totalCents`, etc.) | Cero riesgo de error de redondeo binario; toda la aritmética de dinero es entera |
| ORM | Prisma 5.x | Igual que V2, bien documentado con NestJS 10 |

## Estado actual (fin de Fase 1, primer corte)

Construido y compilando (TypeScript limpio, ESLint limpio):
- Monorepo (`pnpm-workspace.yaml`, `apps/api`, `apps/web` placeholder, `packages/shared-types` placeholder).
- `prisma/schema.prisma` V3: corrige el bug de FK de `service_contracts.clientId` (apuntaba a `services` en vez de `users`), añade índices en todas las FKs, dinero en centavos, timestamps consistentes, `deletedAt` en los 4 modelos financieros primarios (purchases, invoices, budgets, service_contracts), y el modelo `RefreshToken`.
- `PrismaService` / `PrismaModule` — un único `PrismaClient` para toda la app (corrige el bug de V2 de múltiples instancias en controllers).
- `AuthModule` completo: `register`, `login`, `refresh` (con rotación + reuse detection), `logout`.
- RBAC: `@Roles()`, `@RequirePermissions()`, `RolesGuard`, `PermissionsGuard`, todo aplicado **globalmente** con default-deny (`JwtAuthGuard` global + `@Public()` para opt-out explícito). Esto invierte el bug crítico de V2 donde todos los endpoints eran públicos por omisión.
- `main.ts` endurecido: helmet, CORS explícito por env, `ValidationPipe` global con `whitelist`/`forbidNonWhitelisted`.
- Rate limiting global (`@nestjs/throttler`) + límite más estricto en `/auth/login`.

**Fase 2 completa.** Todos los módulos de dominio del schema V3 están construidos: Auth, Users, Products, Purchases, Budgets, Invoices, Services + ServiceContracts.

### Invoices — lo que se construyó

- Sin `totalCents` almacenado: el total se calcula desde `lines` + `charges` en cada lectura (`computeTotals`). Decisión deliberada — a diferencia de Purchases, una factura puede recibir cargos posteriores a la emisión, y guardar un total redundante introduciría riesgo de desincronización.
- Cada línea referencia como mucho **uno** de producto/servicio/contrato de servicio (o ninguno, ítem libre) — validado explícitamente, rechaza referencias combinadas.
- `POST /invoices` y las mutaciones (estado, cargos, borrado) son exclusivas de ADMIN/OWNER — el negocio emite la factura, no el cliente. El cliente solo tiene lectura de su propia factura vía `OwnershipGuard`.
- Los cargos posteriores (mora, ajustes) se agregan como registros nuevos en `InvoiceCharge`, nunca modificando las líneas originales — preserva el snapshot de lo facturado.

### Services + ServiceContracts — lo que se construyó

- `ServicesController`: catálogo, mismo patrón exacto que Products (lectura para cualquier autenticado, mutaciones ADMIN/OWNER).
- `ServiceContractsController`: separado del catálogo — un contrato puede referenciar un servicio del catálogo (hereda `name`/`priceCents` si no se sobreescriben, mismo patrón que Budgets/Invoices) o ser un contrato a medida sin entrada en el catálogo.
- Asignaciones de equipo (`ServiceAssignment`) anidadas bajo el contrato (`POST/DELETE /service-contracts/:id/assignments`) — no son un recurso de primer nivel, no tienen sentido de negocio fuera de su contrato.
- Emisión y mutaciones de contrato exclusivas de ADMIN/OWNER; el cliente solo lee su propio contrato vía `OwnershipGuard`.

### Validación final de Fase 2

`tsc --noEmit` sobre TODO el backend: los únicos errores son los enums que Prisma generaría (`Role`, `PermissionName`, `PaymentMethod`, `PaymentStatus`, `ChargeType`, `ProductType`, `ContractStatus`) — el mismo bloqueador de red documentado desde el principio, sin ningún error nuevo de lógica. ESLint limpio en todo el proyecto.

**Siguiente fase real (Fase 3 del roadmap original):** idempotencia en creación de pagos/compras, logging estructurado, rate limiting ya está (Fase 1), documentación OpenAPI/Swagger, y — lo más importante antes de seguir — que tú corras `prisma generate` + `migrate dev` + `test` en tu máquina para confirmar que todo esto compila y funciona contra una base de datos real. No voy a seguir construyendo funcionalidad nueva a ciegas sobre un backend que nunca se ejecutó de verdad.



### Budgets — lo que se construyó

- Regla de línea (producto de catálogo O ítem libre) sacada del controller (donde vivía en V2) y puesta en el service, validada explícitamente — nunca las dos combinadas de forma ambigua, nunca ninguna.
- Update de líneas es reemplazo completo transaccional (borra + crea dentro del mismo `$transaction`), no parche línea por línea — más simple y predecible para editar una propuesta.
- A diferencia de Purchases, el propio dueño SÍ puede editar/borrar su presupuesto (no tiene estado de pago que proteger), vía `OwnershipGuard` sin restricción adicional de rol.

**Bug propio corregido en este corte:** `UsersModule` y `ProductsModule` se habían creado pero nunca se importaron en `AppModule` — quedaron sin rutas montadas. Corregido, junto con el cableado del filtro global de excepciones (`AllExceptionsFilter`) y `PurchasesModule`.

### Purchases — lo que se construyó

- Creación transaccional (`$transaction`): resolver precios, calcular total y crear compra+líneas es atómico — si algo falla a mitad de camino, no queda una compra huérfana ni líneas sin compra (el bug #1 de "sin transacciones" de la auditoría, resuelto para este módulo).
- Snapshot de precio: `unitPriceCents` se congela en la línea de compra al momento de comprar, no se recalcula si el producto cambia de precio después.
- `clientId` nunca viaja en el body del POST — se toma del usuario autenticado. Un usuario no puede crear una compra a nombre de otro, ni por error del cliente HTTP.
- Listado con scope automático: un usuario normal solo ve sus propias compras; ADMIN/OWNER ven todas (o filtran por `?clientId=`).
- Cambio de estado de pago y borrado (soft delete) son operaciones exclusivas de ADMIN/OWNER.


## Base de datos: ya conectada a Supabase (proyecto "Financeapi")

El schema completo (16 tablas, 7 enums, todos los índices de FK, RLS habilitado sin policies) ya está aplicado en tu proyecto de Supabase (`kzjyozmrhpvgmfdtbeoy`, Postgres 17, `us-east-1`) — lo hice directo vía el conector MCP de Supabase, sin pasar por `prisma migrate dev` (que sigue bloqueado por la falta de red a `binaries.prisma.sh` en este sandbox).

**Verificado con `get_advisors` de Supabase:** cero errores/warnings de seguridad reales — solo avisos INFO de "RLS sin policies" (esperado y correcto: bloquea la API REST autogenerada de Supabase por defecto) y "índice sin uso" (esperado: la base está vacía, todavía no hay tráfico).

### Por qué no corras `prisma migrate dev` todavía

Como el schema se aplicó directo por SQL, Prisma no tiene su tabla `_prisma_migrations`. Si corres `migrate dev` ahora, Prisma va a pensar que faltan todas las tablas. Dejé la migración baseline en `prisma/migrations/20260830000000_init/migration.sql` (el mismo SQL que apliqué en Supabase) para que la marques como ya aplicada.

### Pasos para conectar tu backend local

```bash
cd apps/api
cp .env.example .env
```

En `.env`, reemplaza `DATABASE_URL` y `DIRECT_URL` con la connection string real de tu proyecto — no puedo obtenerla yo: la API de Supabase no expone el password por seguridad. Las sacas de **Supabase Dashboard → Financeapi → Project Settings → Database → Connection string → URI**: `DATABASE_URL` es el "Transaction pooler" (puerto 6543, la recomendada para una app tipo servidor con Prisma en runtime); `DIRECT_URL` es el mismo host pero puerto 5432 sin `pgbouncer=true` — la necesita `prisma migrate`/`db seed` (ver "Validación en máquina real" más abajo: sin esto, `prisma migrate` se cuelga sin error). Van a verse algo así:

```
DATABASE_URL="postgresql://postgres.kzjyozmrhpvgmfdtbeoy:[TU-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.kzjyozmrhpvgmfdtbeoy:[TU-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

Luego:

```bash
npm install
npx prisma generate
npx prisma migrate resolve --applied 20260830000000_init   # marca la baseline como aplicada, UNA sola vez
npm run build
npm run test
npm run start:dev
```

De ahí en adelante, `prisma migrate dev` funciona normal para cualquier cambio futuro del schema.

## Estado verificado en real (no solo compilado en sandbox)

El backend corre de punta a punta contra Supabase real: `npm run build`, `npm run test`, `npm run start:dev` limpios, `GET /health` responde con conexión real. Idempotencia probada end-to-end contra la base real (mismo key+body → misma respuesta sin duplicar; mismo key+body distinto → 409).

Bugs reales encontrados en el proceso, corregidos y sincronizados en este repo:
- `schema.prisma`: faltaba la relación inversa `serviceContracts ServiceContract[]` en `User` — rompía `prisma generate`. Era un bug mío del schema original.
- `auth.service.ts`: `TokenPair` no estaba exportado.
- `invoices.service.ts`: tipado explícito reforzado en `resolveLines` (el resultado de `Promise.all` sobre product/service/serviceContract) — con los enums reales generados, la inferencia de tipos que funcionaba "a ciegas" en el sandbox se comportaba distinto.
- `prisma migrate resolve` se cuelga contra el pooler de transacciones (puerto 6543) por los advisory locks de Prisma — hay que correrlo puntualmente contra el puerto 5432 (session), no el pooler.

### Aviso de seguridad resuelto
`public._prisma_migrations` tenía RLS deshabilitado en Supabase (visible para roles `anon`/`authenticated` si se activa la API REST autogenerada). Corregido: `ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;` ya aplicado.

### ⚠️ Aviso crítico sin resolver — requiere tu acción, no la mía
El repositorio git de este proyecto está inicializado en `C:\Users\Jordin\.git` (la carpeta de usuario completa de Windows), no en la carpeta del proyecto. Cualquier `git add`/`commit` desde ahí puede arrastrar archivos de **todo tu perfil de Windows** — otros proyectos, documentos, credenciales cacheadas, historial de otras apps. Esto no se corrige con código; hazlo antes de tocar git de nuevo:
1. `cd C:\Users\Jordin` → confirmá qué hay en `.git` con `git status` (mirá si ya se agregó algo que no debería).
2. Si no hay commits que te importe conservar: borrá esa carpeta `.git` (`Remove-Item -Recurse -Force .git` en PowerShell).
3. Andá a la carpeta real del proyecto (ej. la carpeta que contiene `apps/`, `packages/`, `pnpm-workspace.yaml`) y ahí sí `git init`.
4. Verificá que el `.gitignore` que ya tenés en la raíz (`node_modules`, `.env`, `dist`, etc.) está en esa misma carpeta.


### Idempotencia en creación de pagos/compras — construido

- Header opcional `Idempotency-Key` en `POST /purchases` y `POST /invoices` (los dos endpoints de creación financiera crítica).
- `IdempotencyInterceptor`: primera llamada con una key ejecuta y guarda la respuesta; un reintento con la **misma key + mismo payload** devuelve la respuesta guardada sin re-ejecutar la creación (nunca duplica la compra/factura); la misma key con un **payload distinto** es un `409 Conflict` explícito.
- Tabla `idempotency_keys` ya aplicada en Supabase (`kzjyozmrhpvgmfdtbeoy`), migración espejo en `prisma/migrations/20260831000000_add_idempotency_keys/`.
- Sin el header, el endpoint se comporta exactamente igual que antes — es opt-in, no rompe nada existente.

### Logging estructurado (pino) — construido

- `nestjs-pino` reemplaza el logger default de Nest globalmente (`app.useLogger`) — cualquier `new Logger(name)` existente en el código (ej. `PrismaService`) automáticamente pasa a loguear vía pino, sin tocar esos archivos.
- Correlación por `requestId`: cada request genera o hereda un id (`genReqId`), y todos los logs de esa petición —incluyendo el del `AllExceptionsFilter` en un 500— comparten ese id. Se puede reconstruir el flujo completo de una request filtrando por ese campo.
- Redacción automática: `authorization`, `cookie`, `password`, `passwordHash`, `refreshToken` nunca aparecen en un log, ni por accidente en modo debug.
- Formato dual por `NODE_ENV`: `pino-pretty` legible en desarrollo, JSON crudo en producción (lo que espera cualquier agregador real — CloudWatch, Datadog, etc.).

### Documentación OpenAPI/Swagger — construido, cierra Fase 3

- Disponible en `/docs` una vez levantado el server (`http://localhost:5050/docs`).
- Plugin de CLI de Nest (`@nestjs/swagger` en `nest-cli.json`) activado: infiere los schemas de los DTOs automáticamente desde los tipos y decorators de `class-validator` ya existentes — no hubo que decorar campo por campo a mano.
- `@ApiBearerAuth('access-token')` en todos los controllers protegidos (todos menos `auth`, que es público); el botón "Authorize" de Swagger UI queda listo para pegar el JWT y probar los endpoints protegidos directo desde ahí.
- Nota de criterio dejada en el propio `main.ts`: para un despliegue real en producción, lo estándar es gatear `/docs` detrás de auth o deshabilitarlo — acá queda expuesto a propósito porque es un proyecto de portafolio y la documentación viva es parte de lo que se quiere mostrar.

**Fase 3 completa:** idempotencia, logging estructurado, y ahora Swagger. Transacciones y rate limiting ya estaban de fases anteriores.

**Validación:** `tsc --noEmit` sobre todo el backend — los mismos 15 errores de siempre (enums que Prisma generaría), cero nuevos. ESLint limpio.

## Fase 4 completa — testing, CI, documentación de portafolio

- **Suite de tests de dominio real** (no boilerplate): `AuthService` (registro, login, y sobre todo rotación de refresh token + detección de reuso), `RolesGuard`/`PermissionsGuard` (lógica de RBAC pura), `PurchasesService` (snapshot de precio, cálculo de total, rollback si un producto no existe), `BudgetsService` (la regla de línea excluyente que en V2 vivía mal ubicada en el controller). **16/16 tests pasan en este sandbox** con Prisma mockeado — los 2 suites de guards que no corren acá es exclusivamente el bloqueo de red a `binaries.prisma.sh`, van a pasar solos en tu máquina.
- **CI** (`.github/workflows/ci.yml`): lint + build + test en cada push/PR. No necesita credenciales reales de Supabase — `prisma generate` solo lee el schema, y los tests mockean Prisma por completo.
- **README.md** en inglés (decisión deliberada: tu objetivo es trabajo remoto internacional, un README en español reduce el alcance de quién lo lee antes de mirar el código).
- **SECURITY.md**: checklist honesto contra OWASP API Security Top 10, con lo que está resuelto y lo que no.
- **Bug propio encontrado al armar el checklist:** nunca versioné la API (`/api/v1`) en la reescritura V3 — V2 sí lo tenía. Corregido en `main.ts` (`setGlobalPrefix`, con `/health` excluido a propósito).
- **Auditoría de dependencias real, no asumida:** `npm audit` bajó de 26 a 17 vulnerabilidades vía `overrides` puntuales (`qs`, `multer`, `body-parser`, `lodash`, `file-type`, `js-yaml`) sin tocar la major de Nest. Quedan 4 moderadas en producción, todas el mismo advisory de `@nestjs/core` (CWE-74, sin fix por debajo de Nest 12) — documentado en `SECURITY.md` como trade-off deliberado, no como descuido.

## Frontend — primer corte (scaffold real, no mockup)

**Decisiones cerradas:** Next.js 16 (App Router), JWT con access en memoria + refresh en cookie httpOnly vía BFF (route handlers de Next), shadcn/ui como sistema de componentes.

**Construido y validado** (`tsc --noEmit` limpio, ESLint limpio):
- Monorepo actualizado: `apps/web` ahora es la app real de Next.js, no el placeholder.
- Tokens de diseño (`globals.css`) migrados 1:1 desde el mockup aprobado — misma paleta Studio Fintech (`--primary: #0E6B5C`, etc.), incluye variante dark completa.
- shadcn/ui armado a mano (`components.json`, `lib/utils.ts`, componentes `Button`/`Input`/`Label`/`Avatar`) — el CLI interactivo de shadcn se cuelga en este sandbox, no es un problema del código.
- **BFF de auth completo:** `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout` — el refresh token nunca llega al navegador como JSON, vive solo en cookie httpOnly; el access token vuelve al cliente y se guarda en memoria (`AuthContext`, nunca `localStorage`).
- `AuthContext`: refresh silencioso al montar la app (recupera sesión desde la cookie), `authFetch` que reintenta una vez tras un 401 refrescando el token.
- Login real (`/login`) contra el backend real — no un formulario de mentira.
- Dashboard shell real: sidebar colapsable + topbar con datos del usuario logueado (decodificados del JWT), guard de sesión (`loading`/`unauthenticated`/`authenticated`) en el layout.
- Página de dashboard con **datos reales de la API** (`GET /purchases`, `GET /invoices` vía `authFetch`) — a diferencia del mockup estático, acá no hay métricas de "Gastos"/"Balance neto" simuladas: si el dato no existe en el backend, no se muestra, en vez de inventarlo.

**Pendiente explícito, no construido todavía:**
- Página de detalle de Products (Purchases la referencia solo como texto, sin link, porque no existe todavía).

### Registro, Cmd+K, skeletons — completos

- **`/register`**: llama directo a `POST /auth/register` (público, sin pasar por el BFF ya que no hay tokens en esa respuesta), y auto-loguea tras crear la cuenta en vez de mandar a escribir las credenciales de nuevo en `/login`.
- **Cmd+K real**: `CommandPaletteProvider` centraliza el estado abierto/cerrado — lo dispara tanto el atajo global `⌘K`/`Ctrl+K` como el click en el buscador del Topbar (que hasta este corte no hacía nada). Navega de verdad a cada sección del dashboard.
- **Skeletons**: reemplazan el texto "Cargando…" en las 5 listas de dominio + el dashboard — filas de tabla o cards según el layout de cada página, no un spinner genérico.

**Con esto, todos los pendientes explícitos que quedaban del frontend están cerrados.** `tsc --noEmit` y ESLint limpios en todo `apps/web`.

### Invoices (frontend) — completo

- Alta con selector de cliente real (`GET /users`, admin-only) — a diferencia de Purchases, acá `clientId` sí lo elige quien factura, no se auto-asigna.
- Cada línea del formulario tiene un toggle "Del catálogo" / "Ítem libre" — refleja en la UI la misma regla de exclusión que ya existe en el backend (`resolveLines` de `InvoicesService`), no una simplificación aparte.
- Detalle muestra el desglose real: subtotal + cargos = total (`computeTotals` del backend, no un cálculo duplicado en el frontend).
- Alta de cargos post-emisión (mora/descuento/otro) desde el detalle, sin tocar las líneas originales — igual que en el backend.

### Budgets, Services, Users (frontend) — completos

- **Budgets**: a diferencia de Purchases/Invoices, acá el dueño (no solo ADMIN) puede editar y borrar — el detalle tiene modo edición inline real (`PATCH` con reemplazo completo de líneas, igual que hace el backend), no solo lectura. El editor de líneas (`components/budget-line-editor.tsx`) es compartido entre alta y edición para no triplicar el mismo formulario.
- **Services**: catálogo simple, mismo patrón que Products — list/detalle/edición/borrado, mutaciones ADMIN/OWNER-only en el backend.
- **Users**: sin página de alta — los usuarios se registran vía `/auth/register` (público), no hay endpoint de admin para crear usuarios directamente. Detalle con edición de perfil (dueño o admin, ownership con auto-propiedad) y desactivación de cuenta (admin-only).
- Regla consistente en las 8 páginas de dominio: cuando una acción es admin-only y el JWT no lleva rol (ver nota en Purchases), el botón se muestra siempre y el backend responde 403 si no corresponde — la UI nunca es la barrera de seguridad real.

**Con esto, el CRUD completo de los 7 módulos de dominio del backend (Users, Products vía Services, Purchases, Budgets, Invoices, Services, y lectura de contratos pendiente) tiene su contraparte real en el frontend**, no solo el resumen del dashboard.

**Limitación del sandbox, igual que con Prisma:** `next/font/google` necesita `fonts.googleapis.com`, que no está en la lista blanca de red de este entorno — `npm run build` falla ahí específicamente. `tsc --noEmit` y ESLint están limpios; el build completo hay que confirmarlo en tu máquina.


## Limitación conocida del entorno de generación

Este código fue escrito en un sandbox sin acceso de red a `binaries.prisma.sh` (motor de Prisma) y sin una instancia de Postgres real. Por eso:
- `npx prisma generate`, `prisma migrate dev` y `nest build` completo **no se pudieron ejecutar aquí**.
- Sí se validó: `tsc --noEmit` (los únicos errores son los tipos `Role`/`PermissionName`, que Prisma genera — desaparecen en cuanto corras `prisma generate`), y ESLint (limpio).

### Para terminar de validar en tu máquina

```bash
cd apps/api
cp .env.example .env        # y completa DATABASE_URL y DIRECT_URL con tu Postgres real
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run build
npm run test
npm run start:dev
```

Si algo falla en `prisma migrate dev` o en el build una vez generado el client, pégame el error exacto y lo resolvemos — preferible a que yo asuma que funcionó.

## Validación en máquina real — completa

Todo lo que el sandbox no pudo confirmar, corrido y verificado en la máquina real:

- **Bug encontrado: `prisma migrate status`/`deploy` se colgaban sin error.** Causa: `DATABASE_URL` apunta al *transaction pooler* de Supabase (puerto 6543, pgbouncer) — modo que no soporta los advisory locks ni prepared statements que `prisma migrate` necesita internamente. Se cuelga en silencio en vez de fallar con un mensaje claro. Fix: `directUrl` agregado al `datasource` de `schema.prisma` + `DIRECT_URL` (mismo host, puerto 5432, sin `pgbouncer=true`) en `.env`/`.env.example`. Runtime sigue usando el pooler (`DATABASE_URL`); solo las migraciones usan la conexión directa.
- `npx prisma generate` + `npx prisma migrate status`: **"Database schema is up to date!"** — las 4 migraciones (incluidas las 2 nuevas de esta sesión: `add_service_assignment_unique`, `idempotency_key_pending_status`) ya estaban aplicadas contra el Supabase real.
- Backend: `tsc --noEmit` limpio (los 15 errores de siempre desaparecieron con el client regenerado), `npm run build` limpio, `npm run lint` limpio, **73/73 tests en 13 suites pasan** — incluidas las 2 suites de guards que en el sandbox no corrían por el bloqueo de red a `binaries.prisma.sh`.
- Frontend: `tsc --noEmit` limpio, `npm run lint` limpio, y **`npm run build` completo por primera vez** (el bloqueo a `fonts.googleapis.com` que afectaba al sandbox no existe acá) — las 23 rutas compilan y prerenderizan sin error.

**Conclusión:** no era solo "confirmar que funciona" — había un bug real de configuración (pooler vs. conexión directa para migraciones) que hubiera bloqueado a cualquiera que clonara el repo y corriera `prisma migrate dev` en una base nueva.
