# FinanceAPI v3 – Project Status

## Fecha de última actualización

2026-09-07

## Estado general

- Backend: 🟢 Cerrado.
- Frontend: 🟢 Cerrado a nivel de diagnóstico — Etapas 1, 2 y 3 cerradas, Service Contracts implementado, Roles y permisos implementado.
- Todo el trabajo está commiteado (13 commits, ver "Último commit"). Único pendiente del proyecto: `git push` (no ejecutado, a criterio del usuario).

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

- Hash: `f200524`
- Mensaje: docs: add session continuity rules and project status tracking

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

1. `git push` cuando el usuario lo decida — no ejecutado en esta sesión.

## Notas importantes

- No quedan pendientes de diagnóstico, implementación, QA ni de commit — todo lo de arriba está cerrado y en el historial de git.
- Los widgets "Pronto" del dashboard son una decisión de alcance deliberada, no un faltante: quedan como roadmap/post-MVP.
- `apps/api/package-lock.json` y `apps/web/package-lock.json` quedan fuera del repositorio por decisión explícita del usuario.
