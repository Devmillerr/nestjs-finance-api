# FinanceAPI v3 – Project Status

## Fecha de última actualización

2026-09-09

## Estado general

- Backend: 🟢 Cerrado.
- Frontend: 🟢 Cerrado a nivel de diagnóstico — Etapas 1, 2 y 3 cerradas, Service Contracts implementado, Roles y permisos implementado.
- Todo el trabajo está commiteado y publicado. La rama `feat/finance-api-complete` fue pusheada correctamente a `origin` y está al día (`up to date with 'origin/feat/finance-api-complete'`). Proyecto publicado y sincronizado.
- La rama `V2` permanece intacta en `origin`; ambas historias (`feat/finance-api-complete` y `V2`) siguen sin ancestro común (`git merge-base` no encuentra base compartida).

## Etapas

- [x] Backend cerrado
- [x] Frontend – Etapa 1 (Consistencia) — aprobada
- [x] Frontend – Etapa 2 (Resiliencia) — aprobada
- [x] Frontend – Etapa 3 (Responsive) — QA visual real ejecutada; cerrada
- [x] Service Contracts — MVP implementado
- [x] Roles y permisos — UI en `users/[id]` implementada

## Resumen técnico por área

- **Backend**: cerrado. RBAC (`RolesGuard`/`PermissionsGuard`/`OwnershipGuard`), idempotencia en endpoints mutables + reaper de keys huérfanas, gestión de roles/permisos, agregados de dashboard.
- **Frontend – Etapa 1 (Consistencia)**: aprobada. Sidebar/topbar rediseñados, drawer mobile, tema claro/oscuro, command palette, tablas y diálogos con comportamiento mobile-safe.
- **Frontend – Etapa 2 (Resiliencia)**: aprobada. Error boundaries, `not-found`, skeletons de carga, reintento de sesión tras 401.
- **Service Contracts**: MVP completo — listado, detalle (cambio de estado, asignación/remoción de equipo), alta (catálogo o personalizado), borrado con confirmación. Consistente con el resto de la app.
- **Dashboard**: funcional, conectado a `GET /dashboard/stats` (vencidas, concentración de ingresos, próximos vencimientos, actividad reciente — todo real). Los widgets "Salud financiera", "Caja proyectada" y "Caja disponible" quedan deliberadamente como roadmap/post-MVP (requieren modelos o integración bancaria que no existen todavía).
- **Roles y permisos**: implementado de punta a punta. Backend ya tenía `PATCH /users/:id/role` (OWNER-only) y `POST/DELETE /users/:id/permissions` (ADMIN/OWNER); se agregó el fix aditivo de `GET /users/:id` para incluir `permissions` en la carga inicial, y la card "Rol y permisos" en `users/[id]` (cambio de rol, otorgar/revocar permisos, protección contra que un OWNER se degrade a sí mismo).
- **Responsive (Etapa 3)**: QA visual real ejecutada en el navegador (sesión OWNER autenticada, no solo lectura de código) a 375px, 390px, tablet (768px) y desktop (~1536px). Revisado sin problemas: MobileNav/Sidebar/Topbar, PageHeader y headers de detalle, tablas con scroll horizontal, formularios de 2 columnas, ConfirmDialog, Command palette, Dashboard, Invoice detail y su formulario de cargos, tabla de Usuarios, Rol y permisos.
  - **Bug real encontrado y corregido:** en las filas "Asignar persona" (`service-contracts/[id]`) y "Otorgar permiso" (`users/[id]`), el `<select>` combinaba `flex-1` con `w-full` dentro de un `flex flex-wrap`, y a 375px el texto quedaba cortado ("Seleccioná un per…") en vez de pasar a su propia línea. Corregido a `flex-col gap-2 sm:flex-row sm:items-center` (stack completo en mobile, fila inline desde `sm`), sin cambios visuales en desktop.
  - No se tocó paleta, tipografía ni tokens.

## Verificaciones ejecutadas (2026-09-07)

Consolidado de todo lo que se corrió realmente en esta sesión (nada se afirma sin haberse ejecutado):

- `apps/api`: `npm test` → ✅ 73/73 tests, 13/13 suites (en la primera corrida tras el fix de `findOne`, 5 tests de `users.service.spec.ts` fallaron por un fixture de mock desactualizado; corregido y vuelto a correr en verde)
- `apps/api`: `npm run build` → ✅ sin errores
- `apps/api`: `npm run lint` → ✅ sin issues
- `apps/web`: `npx tsc --noEmit` → ✅ sin errores de tipos (corrido dos veces: tras roles/permisos y tras el fix responsive)
- `apps/web`: `npm run build` → ✅ compila y prerenderiza 23 rutas sin errores (corrido dos veces, mismas condiciones)
- `apps/web`: `npm run lint` → ✅ sin issues (corrido dos veces, mismas condiciones)

La auditoría de frontend en sí (la que originó el punteo de bloqueadores/pendientes) fue solo de lectura de código — no ejecutó build/lint/test, y sus hallazgos ya están resueltos y reflejados arriba.

## Último commit

- Hash: `eb03aeb`
- Mensaje: fix(ci): trigger workflow on the actual production branch

## Historial de esta sesión (13 commits, en orden)

1. `bcad7a7` fix(api): harden auth flow, error handling and permission guards
2. `3ccf97a` feat(api): protect invoice charges with idempotency keys and reap orphaned ones
3. `8eed0b6` feat(api): add role and permission management for users
4. `790577c` feat(api): add dashboard stats aggregation endpoint
5. `49f65dd` chore(api): add prisma seed for permission catalog and bootstrap owner
6. `d3380ff` fix(api): enforce unique service contract assignments
7. `c1dd341` feat(web): redesign navigation shell with mobile drawer, theme toggle and command palette
8. `9be4ec2` feat(web): add resilient error boundaries and loading states
9. `070a1f1` refactor(web): adopt shared layout components across CRUD pages
10. `6869aa9` feat(web): connect dashboard overview to real backend stats
11. `7b1cf92` feat(web): add service contracts module UI
12. `fdfb85a` feat(web): add roles and permissions management UI to user profile
13. `f200524` docs: add session continuity rules and project status tracking

Validado tras los 13 commits: `apps/api` (`tsc --noEmit`, `lint`, `build`, `test` → 73/73) y `apps/web` (`tsc --noEmit`, `lint`, `build` → 23 rutas) todo en verde, sin necesidad de commits correctivos.

**Suelto (excluido del repo, sin trackear a propósito):** `Dashboard - Auditoría y Conceptos.dc.html`, `apps/api/package-lock.json`, `apps/web/package-lock.json`.

## Próximo objetivo

1. Decidir qué hacer con lo que sigue suelto en el working tree (sin commitear): `apps/api/prisma/seed-qa.ts` + el script `prisma:seed:qa` agregado en `apps/api/package.json`, y los archivos de debris de una sesión anterior (`batch_plan.json`, `chunks_meta.json`, `deploy_files.json`, `deploy_files_trimmed.json`, `apps/web/_print_batch.js`, y el `.dc.html` de diseño — estos últimos ya fuera del repo a propósito).
2. Pendientes de auditoría de seguridad ya documentados y no bloqueantes para portafolio: Swagger `/docs` público, `deactivate()` sin el mismo chequeo de auto-acción que `updateRole`, 6 vulnerabilidades moderate de `@nestjs/core`, `npm audit` no automatizado en CI.
3. Fuera de eso, nada pendiente — el proyecto está desplegado en producción, verificado en vivo de punta a punta (ver sesión de abajo), y `feat/finance-api-complete` está pusheada y sincronizada con `origin`.

## Notas importantes

- Los widgets "Pronto" del dashboard son una decisión de alcance deliberada, no un faltante: quedan como roadmap/post-MVP.
- `apps/api/package-lock.json` y `apps/web/package-lock.json` quedan fuera del repositorio por decisión explícita del usuario.

## Cierre de sesión (2026-09-09) — auditoría de despliegue en producción + fixes críticos

Auditoría real de producción (no solo lectura de código): GitHub, backend en Render, frontend en Vercel, Supabase, seguridad, usuarios QA y recorrido funcional completo en navegador real (Chrome, vía `claude-in-chrome`) con sesión `qa.owner`.

**Verificado en vivo (curl contra `https://financeapi-api-m7tt.onrender.com`, API de GitHub, API de Vercel, SQL directo a Supabase, y navegador real):**
- Rama por defecto en GitHub: `feat/finance-api-complete`, sin PRs abiertos, `V2` intacta sin ancestro común.
- Backend: `/health` ok, login/refresh/logout funcionando, rotación de refresh token con detección de reuso (revoca todas las sesiones), rate limiting real (`5/60s` login, `100/60s` general), RBAC y `OwnershipGuard` bloqueando correctamente accesos cruzados, DTO validation bloqueando inyección, `NODE_ENV=production` confirmado en `render.yaml`.
- Los 11 usuarios QA (`qa.owner/admin/user/limited/inactive/team1/team2/cliente1-4`) existen en la base de producción con roles/permisos/estado exactos al seed; `qa.inactive` correctamente rechazado en login.
- Frontend: build limpio en Vercel (23 rutas), sin `localhost` hardcodeado en el bundle de producción, 0 runtime errors server-side.

**Bugs reales encontrados y su resolución:**
1. **CORS crítico (bloqueaba toda la app para un usuario real):** `CORS_ORIGIN` en Render apuntaba a una URL de deployment de Vercel específica (que cambia con cada push), no al dominio estable `https://financeapi-v3-web.vercel.app`. Corregido por el usuario en el dashboard de Render.
2. **Login roto en producción:** `API_URL` (env var server-only del BFF de Next.js, distinta de `NEXT_PUBLIC_BACKEND_URL`) estaba mal seteada en Vercel — apuntaba a `.../api/v` sin el `1`, rompiendo login/logout/refresh con 404. Corregido por el usuario en Vercel.
3. **CI de GitHub Actions nunca corría:** `.github/workflows/ci.yml` disparaba sobre push/PR a `main`, rama que no existe (solo hay `V2` y `feat/finance-api-complete`). Corregido en código, commiteado (`eb03aeb`) y pusheado a `origin`.

**Verificación final post-fix (navegador real, sesión `qa.owner`):** login → Cabina → Facturas → Compras → Productos → Servicios → Presupuestos → Contratos → Usuarios → Logout, sin errores de consola ni 404/401/500/CORS en ningún paso. Cookie de refresh confirmada httpOnly (`document.cookie` vacío desde JS). Refresh funciona con sesión activa (200) y queda revocado tras logout (401 "No hay sesión activa"). Ruta protegida (`/dashboard`) redirige a `/login` sin sesión.

**Conclusión:** proyecto verificado end-to-end en producción real, listo para portafolio. Único hallazgo no bloqueante durante la verificación: algunos `503` puntuales en prefetches en background de Next.js sobre rutas de detalle de factura (no reprodujo en la corrida final, no afectó ninguna navegación real de usuario) — no investigado a fondo, anotado por si reaparece.

## Cierre de sesión (2026-09-08) — publicación

- Proyecto publicado y sincronizado: `feat/finance-api-complete` está pusheada a `origin` y no hay divergencia (`up to date`).
- `V2` permanece intacta en `origin`; se confirmó que ambas historias no comparten ancestro común.
- No se realizaron cambios de código, builds, tests, lints ni commits en esta sesión — únicamente se actualizó este documento.

## Cierre de sesión (2026-09-08) — QA funcional en navegador

Backend (`apps/api`, puerto 5050) y frontend (`apps/web`, puerto 3000) levantados en modo desarrollo con datos reales (Supabase) y probados en el navegador con sesión OWNER real (login/logout incluidos). Recorrido: Login, Logout, Dashboard, Usuarios, Rol y permisos (otorgar/revocar permiso probado end-to-end contra el backend), Facturas (listado + detalle + líneas/cargos), Compras, Presupuestos, Productos, Servicios, Service Contracts (alta completa probada end-to-end), tema claro/oscuro, Command Palette (⌘K). Sin errores de consola durante el recorrido.

- **Bug real encontrado y corregido:** `apps/web/lib/format.ts` — `formatDate()` formateaba con `toLocaleDateString` en la zona horaria local del navegador, pero las fechas se generan como medianoche UTC (`new Date(dateString).toISOString()` a partir de un `<input type="date">`). Con `es-PE` (Lima, UTC-5) esto corría todas las fechas mostradas un día hacia atrás (ej. contrato creado con fecha de inicio 08/09/2026 se mostraba como "07 set. 2026"; también afectaba vencimiento de facturas y "Registrado" de usuarios). Corregido agregando `timeZone: 'UTC'` a las opciones de `toLocaleDateString`. Verificado tras el fix: fecha de inicio de contrato, vencimiento de factura y fecha de registro de usuarios pasaron a mostrar el valor correcto, sin regresiones en el resto de los módulos que usan `formatDate`.
- **No es un bug:** el nombre de servicio "M I L L E R" se ve con letras muy espaciadas en las cards — se confirmó (vía `get_page_text`) que es dato real guardado así en la base (de una prueba anterior), no un problema de CSS ni de código.
- **No re-testeado por limitación de herramienta:** el drawer mobile no pudo verificarse en esta sesión — `resize_window` (browser automation) no logró achicar el viewport real de la pestaña en este entorno (el layout siguió renderizando en ancho desktop pese a reportar éxito). Ya había sido validado con QA visual real a 375px/390px en la sesión anterior (ver Etapa 3 arriba); no se reabre ese hallazgo.
- **Bug real encontrado y corregido (reportado por el usuario):** el `<select>` nativo (`LedgerSelect`, usado en 8 archivos: `invoices/new`, `products/new`, `products/[id]`, `purchases/new`, `service-contracts/new`, `service-contracts/[id]`, `users/[id]`, `budget-line-editor.tsx`) mostraba su popup de opciones con fondo blanco en modo oscuro. Causa raíz: en Windows, Chromium pinta el popup de un `<select>` nativo fuera del árbol de renderizado de la página, y en la mayoría de versiones ignora el `color-scheme` del CSS — no es corregible solo con CSS. Fix aplicado (con aprobación explícita del usuario, se le presentaron las dos opciones): se reescribió `LedgerSelect` (`apps/web/components/ui/ledger-field.tsx`) para usar por dentro el componente `Select` de Radix ya existente en el repo (`components/ui/select.tsx`, agregado `SelectGroup`/`SelectLabel`), manteniendo la misma API externa (`value`/`onChange` con `<option>`/`<optgroup>` como children), así que no se tocó ninguno de los 8 call-sites. De paso se agregó `color-scheme` también a nivel CSS (`:root`/`.dark` en `globals.css`) como red de seguridad adicional (ya estaba correctamente aplicado vía JS, pero no hacía daño reforzarlo).
  - Verificado en navegador: tema oscuro y claro, opciones simples, opciones agrupadas (`optgroup` de Productos/Servicios en Facturas), select sin placeholder con valor preseleccionado, y el flujo completo de "Otorgar permiso" (grant + revoke) end-to-end contra el backend.
  - Verificado en código: `apps/web`: `tsc --noEmit` ✅ sin errores, `eslint` ✅ sin issues, `npm run build` ✅ compila y prerenderiza 23 rutas sin errores.
- Ambos fixes de esta sesión fueron commiteados y pusheados a `origin/feat/finance-api-complete` en una sesión posterior (commit `0247084`).

## Cierre de sesión (2026-09-08) — auditoría de seguridad pre-producción + fixes de prioridad alta

Auditoría de seguridad de solo lectura (14 puntos: secrets, RLS/Supabase, JWT, guards, cookies, hash, DTOs, SQL, rate limiting, headers, respuestas de API, HTTPS, dependencias) — ver detalle completo en el mensaje de la sesión, no duplicado acá. Resultado: mayoría ✅, dos hallazgos de prioridad alta relacionados con código, corregidos en esta misma sesión con aprobación explícita del usuario:

- **Fix 1 — auto-degradación de OWNER sin protección server-side.** `PATCH /users/:id/role` solo estaba gateado por `@Roles('OWNER')`, sin chequear que el target fuera distinto de quien hace la request — la protección "un OWNER no puede degradarse a sí mismo" que ya mostraba la UI (`users/[id]/page.tsx`) era puramente de frontend. Corregido en `apps/api/src/users/users.service.ts` (`updateRole`, ahora recibe `actingUserId`): (1) bloqueo incondicional si `id === actingUserId && role !== 'OWNER'`; (2) guard general de "último OWNER activo" — si el target es OWNER activo y se le va a quitar ese rol, cuenta OWNERs activos y rechaza si quedaría en 0 (cubre también el caso de un OWNER degradando a *otro* OWNER que sea el último). `apps/api/src/users/users.controller.ts` actualizado para pasar `@CurrentUser().userId` al service. No afecta el flujo normal (cambiar el rol de un USER/ADMIN, o degradar a un OWNER cuando quedan otros activos, sigue funcionando igual).
  - Tests: `apps/api/src/users/users.service.spec.ts` — 4 casos nuevos (bloqueo auto-degradación, no-op de reafirmar OWNER, bloqueo de último OWNER por terceros, permitir degradar OWNER con otros activos) + 2 existentes actualizados a la nueva firma de 3 argumentos.
  - Validado: `tsc --noEmit` ✅, `eslint` ✅ (tras un auto-fix de prettier en el spec), `npm test` → 77/77 (antes 73/73), `npm run build` ✅.
- **Fix 2 — `package-lock.json` sin trackear rompía la premisa de la CI.** `.github/workflows/ci.yml` usa `npm ci` + `cache-dependency-path: apps/api/package-lock.json`, pero ese archivo (y el de `apps/web`) nunca estuvieron en git. Verificado con `npm install --dry-run` y `npm ci --dry-run` (ambos "up to date", sin cambios de versión) que los lockfiles en disco están en sync con sus `package.json` — se agregaron tal cual al repo, sin tocar ninguna versión de dependencia.
- Ambos fixes commiteados en `0cbd9de` (`fix(security): harden owner role changes and lockfile reproducibility`) y pusheados a `origin/feat/finance-api-complete` (`0247084..0cbd9de`) con aprobación explícita del usuario. Rama al día con `origin`, sin divergencia. No se tocó `V2`, no se hizo merge/rebase/reset/force push. HTTPS y el resto de los hallazgos de la auditoría (Swagger `/docs` público, `deactivate()` sin el mismo chequeo de auto-acción, `npm audit` no automatizado en CI, las 6 vulnerabilidades moderate de `@nestjs/core`) siguen pendientes de aprobación individual.
