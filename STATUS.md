# FinanceAPI v3 – Project Status

## Fecha de última actualización

2026-09-07

## Estado general

- Backend: 🟢 Cerrado.
- Frontend: 🟢 Cerrado a nivel de diagnóstico — Etapas 1, 2 y 3 cerradas, Service Contracts implementado, Roles y permisos implementado.
- Único pendiente del proyecto: **commitear el trabajo** (ver "Próximo objetivo").

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

- Hash: `f742b5a`
- Mensaje: fix: finalize backend validation and Supabase connection

## Cambios pendientes de commit

Nada de lo siguiente está commiteado todavía (44 archivos trackeados modificados + ~30 nuevos):

**Backend (`apps/api`)**
- Modificados: `auth.controller.ts`, `auth.service.ts`, `permissions.guard.ts`, `all-exceptions.filter.ts`, `idempotency.interceptor.ts`, `users.controller.ts`, `users.service.ts` (+fix aditivo de `findOne` para roles/permisos), `invoices.controller.ts`, `main.ts`, `app.module.ts`, `package.json`
- Nuevos: módulo `dashboard/`, módulo `common/tasks/` (idempotency-reaper), DTOs `grant-permission.dto.ts` y `update-user-role.dto.ts`, `prisma/seed.ts`, migraciones `add_service_assignment_unique` e `idempotency_key_pending_status`
- Specs nuevos: `all-exceptions.filter.spec.ts`, `ownership.guard.spec.ts`, `idempotency.interceptor.spec.ts`, `invoices.service.spec.ts`, `users.service.spec.ts` (fixture actualizado por el cambio de `findOne`)

**Frontend (`apps/web`)**
- Etapa 1 (Consistencia): `sidebar.tsx`, `topbar.tsx`, `globals.css`, `page-header.tsx`, `command-palette.tsx`, `ui/dialog.tsx`, `ui/table.tsx`, `lib/api.ts`, `lib/nav.ts` (nuevo), `components/mobile-nav.tsx` + `providers/mobile-nav-provider.tsx` (nuevos), `providers/theme-provider.tsx` (nuevo)
- Etapa 2 (Resiliencia): `error.tsx`/`not-found.tsx` (raíz y dashboard), `dashboard/loading.tsx`, `components/error-state.tsx`, `components/detail-skeleton.tsx`, `components/back-link.tsx`, `providers/auth-provider.tsx`
- Reescritura de `dashboard/page.tsx` (conectado a `/dashboard/stats`)
- Módulo Service Contracts (`app/dashboard/service-contracts/`) completo
- Roles y permisos: `app/dashboard/users/[id]/page.tsx` (nueva card), `components/role-badge.tsx` (nuevo), `components/permission-chip.tsx` (nuevo), `lib/permissions.ts` (nuevo)
- Fix responsive (Etapa 3): `app/dashboard/service-contracts/[id]/page.tsx`, `app/dashboard/users/[id]/page.tsx` (fila de asignar/otorgar)
- Ajustes en todas las páginas de detalle/lista/nuevo de budgets, invoices, products, purchases, services, users

**Suelto (excluido del repo):** `Dashboard - Auditoría y Conceptos.dc.html`

## Próximo objetivo

1. Commitear el trabajo pendiente en commits lógicos separados (backend/frontend/documentación), mostrando antes los commits propuestos y archivos incluidos/excluidos, según la regla de Session Continuity en `CLAUDE.md` — propuesta en revisión con el usuario.

## Notas importantes

- No quedan pendientes de diagnóstico, implementación ni QA — todo lo de arriba está cerrado. Lo único que falta es el trabajo mecánico de commitear.
- Los widgets "Pronto" del dashboard son una decisión de alcance deliberada, no un faltante: quedan como roadmap/post-MVP.
- `apps/api/package-lock.json` y `apps/web/package-lock.json` quedan fuera del repositorio por decisión explícita del usuario.
