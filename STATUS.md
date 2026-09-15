# FinanceAPI v3 – Project Status

## Fecha de última actualización

2026-09-14

## Estado general

- Backend: 🟢 Cerrado. `GET /dashboard/stats` extendido (sesión 2026-09-11) con agregaciones para la Cabina rediseñada. Login con Google agregado (sesión 2026-09-14, ver abajo) — código completo y validado, pero **el popup de Google todavía no se pudo confirmar abriendo de punta a punta** (ver detalle: puede ser un tema de configuración del Client ID, no del código).
- Frontend: 🟢 Cerrado a nivel de diagnóstico — Etapas 1, 2 y 3 cerradas, Service Contracts implementado, Roles y permisos implementado. Dirección visual "Premium Dark" consolidada en toda la app (sesión 2026-09-14, commits `02cf16d`..`f435797`, pusheados a `origin`): mismo accent verde esmeralda del login propagado al modo oscuro completo vía tokens centrales.
- **Pendiente de commit:** el login con Google (sesión 2026-09-14, ver abajo) está implementado en este working tree, pero todavía no commiteado — a la espera de confirmar que el popup abre de verdad antes de darlo por cerrado. Todo lo demás de la sesión 2026-09-14 ya está commiteado y pusheado.
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

- Hash: `d44dd15`
- Mensaje: Actualización final

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

1. **Pendiente de aprobación del usuario (fuera de este repo):** commit en el portfolio (`D:\miler-portfolio-final\miler-portfolio`, repo separado) que presenta FinanceApi v3 como proyecto destacado en la sección `Projects`. Implementado y validado (lint/typecheck/build en verde), pendiente de revisión visual final del usuario antes de commitear — ver detalle en la sesión de abajo. No afecta a este repositorio. Los 3 screenshots que usa ese componente (`financeapi-dashboard.jpg`, etc.) quedaron desactualizados tras el rediseño de la Cabina (sesión 2026-09-11) y conviene recapturarlos antes de publicar el portfolio.
2. Pendientes de auditoría de seguridad ya documentados y no bloqueantes para portafolio: Swagger `/docs` público, `deactivate()` sin el mismo chequeo de auto-acción que `updateRole`, 6 vulnerabilidades moderate de `@nestjs/core`, `npm audit` no automatizado en CI.
3. Fuera de eso, nada pendiente en este repo — `feat/finance-api-complete` pusheada y sincronizada con `origin` tras la sesión 2026-09-11, `V2` intacta.

## Cierre de sesión (2026-09-14) — rediseño completo de `/login` (split screen, paleta carbón + verde menta)

**Objetivo:** reemplazar por completo `apps/web/app/login/page.tsx` por un diseño final aprobado por el usuario (mockup `.dc.html` provisto en `Descargas\Rediseño de página de login con paleta oscura\Login FinanceApi.dc.html`): layout de pantalla dividida (panel de marca + formulario), fondo negro carbón (`#0D0D0D`/`#0A0B0A`), acento verde menta (`#00F59B`), botón de Google ajustado (outline oscuro), botón principal "Iniciar sesión" en estilo outline negro con borde/texto verde, toggle de mostrar/ocultar contraseña, checkbox "Mantener la sesión abierta" y link "¿La olvidaste?".

**Decisión de paleta:** los colores del login quedan hardcodeados (Tailwind arbitrary values / inline style) en vez de usar los tokens `--primary` etc. de `globals.css`, porque el tema oscuro global de la app es azul (`#5BA3D0`, dirección "Cabina Carbón" de la sesión 2026-09-11) y el login usa deliberadamente su propia paleta verde menta — es "el único momento oscuro" del producto, no debía tocar el tema del dashboard. No se modificó `globals.css`.

**Tipografía:** se mantuvieron las fuentes ya cargadas en la app (`font-sans` → Inter, `font-mono` → IBM Plex Mono para las etiquetas en mayúscula) en vez de las Space Grotesk/JetBrains Mono del mockup, para no sumar una carga de Google Fonts nueva y mantener consistencia con el resto de la app.

**Funcionalidad real conectada (no es un mockup estático):** el formulario sigue usando `useAuth().login(email, password)` + `router.push('/dashboard')` + manejo de error/loading igual que antes; el botón "Continuar con Google" queda visual únicamente (`onClick` no-op) porque no existe integración de Google OAuth en el backend — no se inventó ninguna.

**Validado (ejecutado de verdad):**
- `apps/web`: `tsc --noEmit` ✅ sin errores, `eslint app/login/page.tsx` ✅ sin issues, `npm run build` ✅ compila y prerenderiza 23 rutas.
- QA visual en navegador real (`npm run dev`, Chrome vía `claude-in-chrome`): `/login` renderiza igual al mockup aprobado, sin errores de consola. **No verificado:** el stacking en viewport mobile real — `resize_window` no logró achicar el viewport en este entorno (misma limitación ya documentada en la sesión 2026-09-08); el CSS (`grid grid-cols-1 lg:grid-cols-2`) debería apilar el panel de marca sobre el formulario por debajo de 1024px, pero no se vio confirmado visualmente.

**Canvas de diseño publicado (fuera de este repo, como referencia visual):** el mockup se sembró y publicó como Design canvas en `https://claude.ai/artifact/WBChswor2wPohReqSNCTTX` para previsualización/exportación PNG-PDF.

**Sin commitear:** cambio hecho únicamente en el working tree (`apps/web/app/login/page.tsx`); a la espera de aprobación explícita del usuario antes de `git add`/`commit`, según la regla de Git del proyecto.

## Cierre de sesión (2026-09-14) — dirección "Premium Dark" propagada a toda la app + rediseño de "Resumen" (ex-Cabina)

**Objetivo:** reemplazar la dirección "Cabina Carbón" (accent azul, sesión 2026-09-11) por "Premium Dark" (accent verde esmeralda `#00F59B`, ya establecido en `/login`), y que TODO el modo oscuro de la app — no solo el login — comparta una sola identidad. Referencia visual: mockup local `Dashboard styling con referencia visual\Cabina Carbón.dc.html` (fondo `#0A0A0B`, tarjetas `#141416`, borde `#232326`, texto secundario `#A1A1AA`).

**Decisión de alcance (no pedida explícitamente, asumida por consistencia con lo ya construido):** se actualizaron los tokens del tema **oscuro** (`.dark` en `globals.css`), no se tocó el tema claro ni se eliminó el toggle claro/oscuro (`ThemeProvider`, ya shippeado en Etapa 1). El tema por defecto de la app ya es oscuro salvo que el sistema operativo pida explícitamente claro, así que esto alcanza a la enorme mayoría de sesiones sin remover una feature aprobada. Si en realidad se quería eliminar el tema claro por completo, decirlo para una sesión aparte.

**Estrategia técnica — tokens + componentes compartidos, no archivo por archivo:** la app ya tenía una arquitectura de theming centralizada (`--primary`, `--card`, `--border`, `--muted-foreground`, etc. en `globals.css`, consumidos vía clases Tailwind `bg-card`/`text-primary`/etc. en todos lados) y componentes compartidos (`Button`, `Table`, `StatusBadge`, `RoleBadge`, `SidebarNavGroups`) ya reutilizados por las 7 secciones. Por eso este cambio se hizo casi enteramente editando un puñado de archivos centrales — no 20 vistas por separado:

- **`apps/web/app/globals.css`:** `.dark` reemplazado — `--primary`/`--ring`/`--success` pasan de azul (`#5BA3D0`) a verde (`#00F59B`, el mismo verde ya usado en `/login`; cobrado reusa el mismo tono que el accent de marca, a propósito), `--background`/`--card`/`--border`/`--muted-foreground`/etc. actualizados a los valores exactos del mockup. El tema claro no se tocó. Se agregó `.animate-fade-up` (keyframe reutilizable, respeta el `prefers-reduced-motion` global ya existente).
- **`components/ui/button.tsx`:** `hover:scale-[1.02]` en la definición base → todo botón de la app (los "+ Nuevo X" de las 7 secciones, "Guardar", etc.) lo hereda sin tocar cada página.
- **`components/ui/table.tsx`:** transición de hover de fila explícita (`duration-150 ease-[var(--ease-out)]`).
- **`components/status-badge.tsx` y `components/role-badge.tsx`:** badges pasados de tokens `-bg` sólidos a opacidad 10% (`bg-success/10 text-success`, etc.) — pedido explícitamente para Facturas/Presupuestos/Compras/Contratos y también aplicado a Usuarios (roles) por consistencia.
- **`components/layout/sidebar.tsx`:** (1) **bug real corregido** — el `<nav>` interno (`SidebarNavGroups`, compartido por el sidebar desktop y el drawer mobile) tenía `flex-1` sin `min-h-0`; un flex item no encoge por debajo de su contenido sin eso, así que con navegación larga el pie (correo + "Cerrar sesión") podía quedar empujado fuera del viewport en vez de dejar scrollear solo al `<nav>`. Se agregó `min-h-0`. El ancho ya animaba al colapsar (`transition-[width]`), no hizo falta tocarlo. (2) `hover:scale-[1.02]` en los enlaces de navegación.
- **~40 tarjetas repetidas en 20 archivos de `app/dashboard/**` (todas las listas, detalles y formularios de alta de las 7 secciones + Resumen):** el wrapper `rounded-xl|rounded-2xl border border-border bg-card` estaba literalmente duplicado en cada página (sin componente `Card` compartido). En vez de crear una abstracción nueva a mitad de un rediseño ya grande, se hizo un reemplazo de texto dirigido (`sed`, acotado a `app/dashboard/`) que le agrega a cada una `animate-fade-up` (entrada) + hover de borde/sombra — excluyendo las 2 tarjetas de producto/servicio que ya tenían su propio hover (`hover:border-primary/40`, que además ahora es verde automáticamente vía el token).

**Cambios específicos en "Resumen" (ex-"Cabina", `app/dashboard/page.tsx` + `lib/nav.ts`):**
- Renombrada "Cabina" → "Resumen" (ítem del sidebar y título derivado por ruta en `navTitleFor`).
- Quitados: el texto "USD" bajo "Por cobrar", la frase "vs. \{período\} anterior" (queda solo la píldora de tendencia), y la pregunta "¿cuándo entra lo que me deben?" (sus dos apariciones).
- "Pipeline del período" renombrada a "Flujo de facturación".
- Decimales de Vencido/Por vencer/Cobrado separados con `splitAmount()` (ya existía para el número grande) y atenuados (`text-muted-foreground/70`), igual que en el mockup.
- Números de los nodos del gráfico "Flujo esperado" fijados a `text-foreground` (blanco puro) siempre, en vez de heredar el color de vencido/muted.
- **Bug real corregido:** las etiquetas de mes y de monto bajo "Flujo esperado" se posicionaban con columnas `flex-1` repartidas en partes iguales, que NO coinciden con la posición real de cada punto de la curva salvo que los buckets sean perfectamente simétricos (la curva usa `pad=12` sobre un `viewBox` de 400, `buildLinePath`). Reemplazado por posicionamiento absoluto usando el `x`/`y` real de cada punto (`forecast.points[i]`) — ahora cada mes queda exactamente debajo de su punto.

**Validado (ejecutado de verdad):**
- `apps/web`: `tsc --noEmit` ✅, `eslint .` ✅ (sin issues en todo el proyecto), `npm run build` ✅ (23 rutas).
- QA visual en navegador real (Chrome vía `claude-in-chrome`, sesión `qa.owner`, backend local levantado contra la misma Supabase de producción documentada en sesiones previas — solo lectura, sin escrituras): Resumen, Facturas, Usuarios. Confirmado: título "Resumen", textos redundantes fuera, decimales atenuados, números del gráfico en blanco, meses alineados bajo cada punto, punto rojo conectado al inicio de la curva verde, pie del sidebar (correo + Cerrar sesión) visible sin cortarse, badges a opacidad 10%, colapso de sidebar animado.
- **No verificado visualmente** (no bloqueante): Presupuestos, Compras, Contratos, Productos y Servicios no se navegaron uno por uno en el navegador — se confirmó por código que las 20 rutas comparten los mismos componentes (`Table`, `StatusBadge`, `Button`, tarjeta con `animate-fade-up`) ya verificados en Facturas/Usuarios, y las 20 compilan sin errores.

**Sin commitear:** todo el cambio queda en el working tree — a la espera de aprobación explícita antes de `git add`/`commit` (regla del proyecto). Archivos tocados: `apps/web/app/globals.css`, `apps/web/lib/nav.ts`, `apps/web/components/ui/button.tsx`, `apps/web/components/ui/table.tsx`, `apps/web/components/status-badge.tsx`, `apps/web/components/role-badge.tsx`, `apps/web/components/layout/sidebar.tsx`, `apps/web/app/dashboard/page.tsx`, y las 20 vistas bajo `apps/web/app/dashboard/**` (solo la clase del wrapper de tarjeta).

### Ajuste posterior (mismo día) — quitar el buscador del encabezado + sidebar `h-screen` literal

Dos correcciones puntuales pedidas después de revisar en navegador:

1. **Buscador quitado del topbar** (`components/layout/topbar.tsx`): el botón "Buscar ⌘K" que abría la command palette se eliminó del encabezado por completo. Es un componente compartido por las 20 rutas (no solo Resumen), así que desaparece en toda la app — el atajo de teclado ⌘K/Ctrl+K sigue funcionando igual (vive en `command-palette-provider.tsx`, no dependía del botón).
2. **Sidebar reestructurado literalmente como se pidió** (`components/layout/sidebar.tsx`): `<aside>` pasa de "tarjeta flotante" (`sticky` + margen + `h-[calc(100vh-1.75rem)]` + bordes redondeados) a `sticky top-0 h-screen flex-col justify-between` a ras del borde, con `border-r` en vez de sombra. Dos bloques estrictos: bloque superior (`min-h-0 flex-1`) con el toggle de colapsar + logo arriba y la navegación con su propio scroll debajo; bloque inferior (`shrink-0`, con `border-t` y padding propio) con avatar + correo + "Cerrar sesión", que ya no se corta. El toggle de colapsar (antes al pie, junto al correo) se movió arriba, junto al logo. Ancho anima con `transition-all duration-300 ease-in-out`; hover de los enlaces con `transition-colors duration-200` (ya existía, se ajustó el timing exacto pedido). **Nota técnica:** se mantuvo `sticky top-0` junto con `h-screen` (no se pidió explícitamente, pero es necesario) porque el layout no tiene contenedor de scroll propio por página — es el `body` el que scrollea en pantallas largas — así que sin `sticky` el sidebar se hubiese ido scrolleando con el resto de la página en vez de quedar fijo.
- `app/dashboard/layout.tsx`: comentario desactualizado corregido (ya no describe al sidebar como "superficie flotante con margen").

**Validado:** `tsc --noEmit` ✅, `eslint` ✅, `npm run build` ✅ (23 rutas). QA visual en navegador real: buscador ausente, colapso/expansión del sidebar fluido, correo + "Cerrar sesión" 100% visibles con navegación completa.

### Segundo ajuste (mismo día) — fidelidad exacta del sidebar contra el archivo de referencia

El usuario proveyó un `.zip` ("Dashboard styling con referencia visual.zip") pidiendo leer un `.html` "limpio" distinto al `.dc.html` anterior. Verificado: el zip contiene exactamente los mismos 3 archivos de siempre (mismo hash/tamaño de `Cabina Carbón.dc.html`) — no existe una exportación HTML separada; se lo comuniqué al usuario y seguí trabajando con el mismo `.dc.html` ya leído.

Comparando línea por línea la sidebar del mockup contra `components/layout/sidebar.tsx`, aparecieron diferencias reales de fidelidad (no solo estéticas — probablemente la razón de que el usuario siguiera viendo el pie "roto" pese al fix de `min-h-0`):
- **Fondo del sidebar:** era `bg-card` (#141416, el mismo gris que las tarjetas); en la referencia el sidebar comparte el negro de fondo de la página (`bg-background`, #0A0A0B) y se separa solo por `border-r`.
- **Botón "Cerrar sesión":** antes era un link de texto chico (10px) apretado debajo del correo, dentro de la misma fila que el avatar. En la referencia es su **propia fila de ancho completo**, con ícono, mismo tratamiento que un ítem de navegación (padding, radio 10px, hover propio) — mucho más fácil de ver y de tocar. Reestructurado así.
- Tamaños ajustados al valor exacto del mockup: ancho del sidebar 214px/66px (antes 216/68), avatar circular de 30px (antes cuadrado redondeado de 26px), botón de colapsar 30px con borde y fondo de tarjeta, radio de los ítems de nav 10px (antes 8px), encabezados de grupo a 11px sin atenuar (antes 9.5px al 70% de opacidad), hover de los enlaces a color sólido (antes 70% de opacidad). Se agregó la línea "FinanceApi · v1.0.0" bajo el correo, presente en la referencia.

**Punto 2 del pedido (propagar la paleta a Facturas/Presupuestos/Compras/Contratos/Productos/Servicios/Usuarios):** ya estaba resuelto por el cambio de tokens de la sesión anterior (mismo `#0A0A0B`/`#141416`/`#00F59B` pedidos ahora) — no hizo falta ninguna acción nueva ahí.

**Validado:** `tsc --noEmit` ✅, `eslint` ✅, `npm run build` ✅ (23 rutas). QA visual en navegador real: sidebar sin costura visible contra el fondo, "Cerrar sesión" como fila completa con su propio hover, colapso/expansión correctos con el sidebar colapsado a 66px.

### Tercer ajuste (mismo día) — nueva lógica de interacción del colapso

Se reemplazó el botón único de colapsar/expandir por dos puntos de entrada distintos, pedidos explícitamente:
- **Sin botón de hamburguesa arriba:** eliminado por completo; el bloque superior ahora es solo el logo.
- **"Resumen" reabre:** con el sidebar colapsado, click en el ítem "Resumen" navega Y expande el sidebar en el mismo gesto (`NavRow` detecta `item.href === '/dashboard'` + `collapsed`, dispara `onExpand`). El resto de los ítems navegan sin expandir.
- **Botón central que solo cierra:** un botón circular con `ChevronLeft`, posicionado `absolute top-1/2 right-0` (centrado verticalmente, a caballo sobre el borde derecho), visible únicamente cuando el sidebar está expandido — su única función es colapsar.

Se mantuvo intacta la estructura `h-screen flex-col justify-between` (bloque inferior con correo + "Cerrar sesión" fijo) del ajuste anterior.

**Validado:** `tsc --noEmit` ✅, `eslint` ✅, `npm run build` ✅ (23 rutas). QA visual en navegador real: botón superior ausente, click en "Resumen" con el sidebar colapsado lo reabre, botón central colapsa y desaparece al expandir, pie siempre visible en ambos estados.

### Cuarto ajuste (mismo día) — limpieza/refactor de los archivos tocados hoy

Pasada de limpieza pedida explícitamente sobre los archivos de esta sesión (`globals.css`, `lib/nav.ts`, `components/layout/sidebar.tsx`, `components/layout/topbar.tsx`, `app/dashboard/page.tsx`, `app/dashboard/layout.tsx`, `components/ui/button.tsx`, `components/ui/table.tsx`, `components/status-badge.tsx`, `components/role-badge.tsx`). Resultado honesto: los comentarios de este proyecto ya eran en español y explicaban el "por qué" (no el "qué") desde antes de esta sesión — no había comentarios automáticos ni en inglés que purgar. Lo que sí apareció y se corrigió:

- **Código CSS muerto real, verificado por grep en todo `apps/web`:** `.rule-fade` (clase definida en `globals.css`, cero usos en cualquier `.tsx`) y el token `--line-soft` que solo alimentaba a esa clase — ambos eliminados junto con su mapeo en `@theme inline`.
- **Comentarios desactualizados (no solo redundantes, directamente incorrectos):** el comentario de cabecera de `sidebar.tsx` seguía describiendo el sidebar como "superficie flotante... no una columna pegada al borde con un divisor" — exactamente lo opuesto de la estructura actual (a ras del borde, con `border-r`). Corregido. Referencias sueltas a "Cabina" (nombre viejo, ya renombrado a "Resumen") en `topbar.tsx` y `app/dashboard/page.tsx` también actualizadas.
- **Comentarios consolidados:** el bloque de comentarios del `<aside>` en `sidebar.tsx` se había ido acumulando en las tres rondas de edición de hoy (min-h-0, h-screen+sticky, bg-background vs bg-card) hasta quedar largo y algo repetitivo; se condensó a las razones esenciales sin perder ninguna.

**Decisión explícita, no una omisión:** se dejó intacta la rampa `--chart-1`...`--chart-5`/`--chart-rest` aunque `--chart-1` y `--chart-5` no tienen consumidor hoy (`chart-2`, `chart-3`, `chart-4` y `chart-rest` sí, en el embudo y la distribución de clientes de "Flujo de facturación"/"Riesgo de cartera"). Es una escala de 6 pasos con nombre coherente, parcialmente usada — borrar solo 2 de los 6 la dejaría con huecos arbitrarios en vez de más limpia. Si se prefiere que se recorte también, decirlo explícitamente.

**Validado:** `tsc --noEmit` ✅, `eslint .` ✅ (sin issues en todo el proyecto), `npm run build` ✅ (23 rutas). Confirmado visualmente en navegador que el diseño y el comportamiento quedaron pixel-idénticos a antes de la limpieza (cambios puramente internos).

## Cierre de sesión (2026-09-14) — login real con Google

**Objetivo:** el botón "Continuar con Google" del login era visual desde el rediseño (sin backend de OAuth). Se implementó el flujo real, a pedido explícito del usuario tras preguntar por qué no funcionaba.

**Primer diseño (descartado en la misma sesión):** verificación de ID token vía el botón pre-armado de Google (`google.accounts.id.renderButton`), oculto y superpuesto sobre el botón ya diseñado. **No funciona**: Google mide ese botón a 0x0 si detecta que su contenedor no es visible — es una protección anti-clickjacking del lado de Google, no hay forma de esconderlo detrás de un botón propio. Confirmado inspeccionando el DOM en vivo (el `<iframe>` interno medía `0,0` incluso con el contenedor correctamente dimensionado).

**Diseño final:** OAuth2 "code client" (`google.accounts.oauth2.initCodeClient`, `ux_mode:'popup'`), pensado por Google específicamente para botones propios — se dispara con `.requestCode()` desde el click real del botón ya diseñado (sin proxy ni click sintético) y abre un popup real. Esto sí requiere un **Client Secret** además del Client ID (el backend intercambia el `code` por un `id_token` en una llamada servidor-a-servidor) — a diferencia del primer diseño, que solo necesitaba el Client ID.

**Backend (`apps/api`):**
- `auth.service.ts` — `OAuth2Client` ahora se construye con Client ID + Client Secret + `redirect_uri:'postmessage'` (el valor especial que espera Google para el code flow por popup). `loginWithGoogle(code, ip)`: intercambia el `code` por tokens (`getToken()`), verifica el `id_token` resultante igual que antes (`email_verified` obligatorio), busca o crea el usuario por email y reutiliza `issueTokenPair()`.
- **Decisión explícita para no migrar el schema:** no se agregó un campo `googleId` a `User` (la tabla vive en la misma base de Supabase que producción; matchear por email alcanza porque Google ya garantiza que ese email está verificado). Una cuenta creada por Google recibe un `passwordHash` aleatorio inutilizable.
- `auth.controller.ts` — `POST /auth/google` (`@Public()`, throttle 5/60s).
- `GoogleLoginDto` — campo `code` (no `idToken`).
- `.env.example` documentado con `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.

**Frontend (`apps/web`):**
- `app/api/auth/google/route.ts` — ruta BFF (sin cambios respecto al primer diseño, es un passthrough genérico).
- `auth-provider.tsx` — `loginWithGoogle(code)`.
- `app/login/page.tsx` — botón ya diseñado con `onClick` directo a `googleClientRef.current.requestCode()`, sin overlay ni click sintético. `error_callback` agregado para que un popup bloqueado muestre un error real en vez de fallar en silencio.
- `.env.local` / `.env.local.example` con `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

**Bug real encontrado y corregido en el `.env` del usuario (no era del código):** `apps/api/.env` tenía un bloque pegado de una plantilla genérica de Google OAuth al final del archivo, con un **segundo `DATABASE_URL` duplicado** (`localhost:5432`, credenciales placeholder) que sobreescribía al `DATABASE_URL` real de Supabase de la línea 1 — el backend no podía levantar por esto. Se limpió el duplicado y las variables sueltas sin uso (`NEXTAUTH_SECRET`, `JWT_SECRET`, `APP_URL`, `NODE_ENV` repetido — leftovers de una plantilla de NextAuth.js, que esta app no usa). Quedaron `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (sí se usan) y `GOOGLE_CALLBACK_URL` (no se usa con este flujo, inofensivo, se dejó sin tocar).

**Validado (ejecutado de verdad):**
- `apps/api`: `tsc --noEmit` ✅, `eslint` ✅, `npm run build` ✅, `npm test` → 78/78 (sin regresiones).
- `apps/web`: `tsc --noEmit` ✅, `eslint` ✅, `npm run build` ✅ (24 rutas, incluye `/api/auth/google`).
- QA en navegador real con el Client ID real del usuario: el script de Google carga, `initCodeClient` se crea correctamente, y un click real (confirmado con un botón de prueba descartable: `window.open()` sí abre popup desde un click real en este navegador) llega al handler. **Pero `requestCode()` de Google devuelve `Failed to open popup window`** en esta sesión de navegador automatizado — no se pudo confirmar el popup de Google abriendo de punta a punta.
- **No se pudo determinar la causa exacta** entre dos posibilidades: (a) algo específico de este navegador controlado por automatización que interfiere solo con popups cross-origin hacia `accounts.google.com` (un `window.open` común sí funcionó, uno de Google no) — no sería un problema para un usuario real; o (b) `http://localhost:3000` no está realmente guardado en "Authorized JavaScript origins" del Client ID en Google Cloud Console, o el cambio no terminó de propagarse (Google documenta que puede tardar unos minutos). **Pendiente para la próxima sesión: probar el botón en un navegador normal (no automatizado) y confirmar el origen autorizado en Google Cloud Console.**

**Sin commitear:** `apps/api/.env.example`, `apps/api/package.json` + `package-lock.json` (dependencia `google-auth-library`), `apps/api/src/auth/auth.controller.ts`, `apps/api/src/auth/auth.service.ts`, `apps/api/src/auth/dto/google-login.dto.ts` (nuevo), `apps/web/app/api/auth/google/route.ts` (nuevo), `apps/web/app/login/page.tsx`, `apps/web/components/providers/auth-provider.tsx`, `apps/web/.env.local.example`. A propósito, a la espera de confirmar el popup antes de darlo por cerrado.

## Notas importantes

- Los widgets "Pronto" del dashboard son una decisión de alcance deliberada, no un faltante: quedan como roadmap/post-MVP.
- `apps/api/package-lock.json` y `apps/web/package-lock.json` quedan fuera del repositorio por decisión explícita del usuario.

## Cierre de sesión (2026-09-11) — nueva paleta de colores + rediseño completo de la Cabina

**Objetivo:** reemplazar la paleta de colores de todo el flujo (login → Cabina) y rediseñar por completo la vista Cabina según un mockup provisto por el usuario (`Cabina Carbón.dc.html`, dirección "Premium Dark / Console" con accent azul `#5BA3D0`, verde `#4FA97E`, rojo `#C9636E`), sin tocar maquetación de otras pantallas ni lógica de negocio fuera de lo necesario para alimentar los widgets nuevos con datos reales.

**Paleta (`apps/web/app/globals.css`):** reemplazo total de los tokens de color en `:root` y `.dark` — de la escala púrpura/blurple anterior ("Cabina" 2C) a la nueva familia carbón + azul de dato + verde/ámbar/rojo semánticos. Mismos nombres de token que ya consumían `status-badge.tsx` y el resto de la app, así que ningún componente cambió su código, solo el valor de las variables. Verificado que no queda ningún color hardcodeado (hex ni clases Tailwind tipo `bg-red-500`) fuera de `globals.css`.

**Rediseño de la Cabina (`apps/web/app/dashboard/page.tsx`):** los 6 widgets anteriores (Salud financiera, Caja proyectada, Concentración del ingreso, Requiere atención, Próximos movimientos, Actividad) se reemplazaron por los 5 del mockup: **Por cobrar** (monto + sparkline + desglose vencido/por vencer/cobrado + tendencia vs. período anterior), **Flujo esperado** (línea de vencimientos agrupados por mes), **Riesgo de cartera** (concentración + antigüedad del vencido + peor cliente), **Pipeline del período** (presupuestado → facturado → cobrado → vencido + conversión) y **Actividad reciente** (con badges por estado real). Los gráficos son SVG propios (sparkline/área/donuts/funnel decorativo) coloreados con los tokens del tema, no una librería — se re-temizan solos entre claro/oscuro.

**Backend (`apps/api/src/dashboard/dashboard.service.ts`):** `GET /dashboard/stats` extendido con agregaciones nuevas y reales (nada inventado en el cliente): `receivable` (vencido/por vencer/cobrado + tendencia vs. período anterior de igual longitud + sparkline de actividad facturada), `cashFlowForecast` (vencido + próximos vencimientos agrupados por mes), `portfolioRisk` (concentración, % vencido +30 días, distribución de clientes, antigüedad en 4 buckets, peor cliente con su factura más vieja) y `pipeline` (presupuestado/facturado/cobrado/vencido + conversión). Se agregó `UserDetails` a los queries de cliente para mostrar iniciales reales (`clientInitials()`, con fallback al id si el cliente no cargó perfil) en vez de solo el id truncado. `dashboard.service.spec.ts` actualizado con 2 casos nuevos (pipeline, concentración/riesgo) — 78/78 tests en verde.

**Dato real registrado (no fabricado en UI):** el gráfico "Flujo esperado" mostraba una línea recta porque solo había 2 puntos de datos (las 3 únicas facturas por vencer del dataset QA caían todas en septiembre). Con aprobación explícita del usuario, se crearon 2 facturas QA nuevas vía API (`qa.cliente2` USD 380.00 vence 02/10, `qa.cliente3` USD 265.00 vence 09/10) para que el bucketing por mes genere un tercer punto real (octubre). **Nota importante:** esto escribió filas reales en la misma base de Supabase que usa producción (el `.env` local de `apps/api` apunta a ese mismo proyecto, ya documentado en la sesión 2026-09-09) — no es un sandbox aislado.

**Validado (ejecutado de verdad):**
- `apps/api`: `tsc --noEmit` ✅, `eslint --fix` ✅ sin issues, `npm test` → 78/78 (antes 76 + 2 nuevos), `npm run build` ✅.
- `apps/web`: `tsc --noEmit` ✅, `eslint` ✅ sin issues, `npm run build` ✅ compila y prerenderiza 23 rutas.
- QA visual en navegador real (Chrome, sesión `qa.owner`): Login y Cabina en los 3 períodos (Mes/Trimestre/Año) y ambos temas (claro/oscuro), sin errores de consola. Verificado que el gráfico de flujo pasó de línea recta a curva real tras las 2 facturas nuevas.

**Commit:** `d44dd15` ("Actualización final") — pusheado a `origin/feat/finance-api-complete` (`13543af..d44dd15`). Archivos: `apps/web/app/globals.css`, `apps/web/app/dashboard/page.tsx`, `apps/api/src/dashboard/dashboard.service.ts`, `apps/api/src/dashboard/dashboard.service.spec.ts`. `Dashboard - Auditoría y Conceptos.dc.html` se dejó fuera del commit (sin trackear a propósito, ver Notas importantes).

**Pendiente para la próxima sesión:** ninguno bloqueante en este repo. Si se retoma el tema del portfolio (punto 1 de "Próximo objetivo"), sus 3 screenshots quedaron desactualizados frente a la Cabina nueva.

## Cierre de sesión (2026-09-10) — FinanceApi v3 destacado en el portfolio (repo externo, sin commitear)

**Nota de alcance:** esta sesión trabajó también sobre un repositorio distinto — el portfolio del usuario en `D:\miler-portfolio-final\miler-portfolio` (proyecto Next.js aparte, deploy en `https://portfolio-delta-fawn-41.vercel.app`). No es parte de este repo (`financeapi-v3-fase1-diseno`); se documenta acá porque es continuación directa del cierre de sesión anterior y porque el usuario pidió actualizar este `STATUS.md`.

**Objetivo:** dejar de mostrar FinanceApi v3 como una card de texto genérica ("API Finanzas") en la sección `Projects` del portfolio, y presentarlo como proyecto full-stack destacado, con screenshots reales de la app en producción.

**Investigación (solo lectura, sin cambios):**
- Se abrió `https://financeapi-v3-web.vercel.app` en un navegador real (sesión ya autenticada, sin necesidad de credenciales) y se recorrió: Cabina/Dashboard, Facturas (listado + detalle), Compras, Contratos, Productos, Usuarios (listado + perfil con roles/permisos).
- Se seleccionaron 3 screenshots reales (sin generar ni inventar ninguna imagen): **Cabina/Dashboard** (principal — vende visualmente el proyecto), **Detalle de factura** (funcionalidad — líneas facturadas, cargos, cambio de estado), **Perfil de usuario · Rol y permisos** (RBAC — complejidad técnica).
- Se ubicó el repo del portfolio en disco (`D:\miler-portfolio-final\miler-portfolio`, Next.js + TypeScript + Tailwind + Framer Motion) y se identificaron los archivos que controlan `Projects`: `components/sections/Projects.tsx` (layout), `lib/constants.ts` (copy de cada proyecto), `components/projects/DigiProyDemo.tsx` (patrón de card featured existente) y `components/projects/RepoStats.tsx` (stats de GitHub en vivo, reutilizado).

**Diseño aprobado por el usuario:** grid de 2 filas — fila 1: DigiProy full width, sin tocar; fila 2: FinanceApi v3 (~65%, destacado) + Mega Red (~35%, compacto, sin cambio de contenido). Descripción actualizada a "Sistema financiero full-stack con backend NestJS y frontend Next.js: facturación, compras, contratos de servicio y catálogo, con RBAC (roles y permisos granulares), autenticación JWT con rotación de sesión, e idempotencia en operaciones mutables. Desplegado en producción." Tecnologías: NestJS, Next.js, TypeScript, Prisma, PostgreSQL, JWT, RBAC. Sin métricas inventadas (se decidió omitirlas — las únicas cifras disponibles son tamaños de dataset QA, no logros de adopción reales).

**Implementación (en el repo del portfolio, todavía sin commitear):**
- Nuevo componente `components/projects/FinanceApiShowcase.tsx`: identidad visual propia (ventana de navegador con barra de URL real + tabs con etiqueta "Cabina/Factura/Roles", crossfade manual, sin autoplay) — deliberadamente distinto del patrón de "device frame" que usa `DigiProyDemo.tsx`.
- `lib/constants.ts`: se quitó "API Finanzas" de `secondaryProjects` (ahora solo Mega Red) y se agregó `financeApiProject`.
- `components/sections/Projects.tsx`: grid reestructurado a 2 filas; nueva card featured de FinanceApi v3 con CTA doble ("Ver demo en vivo" → `financeapi-v3-web.vercel.app`, "Ver repositorio" → GitHub) + `RepoStats` en vivo.
- 3 capturas agregadas a `public/`: `financeapi-dashboard.jpg`, `financeapi-invoice.jpg`, `financeapi-roles.jpg`.

**Validado (ejecutado de verdad en el repo del portfolio):** `npm run lint` ✅ exit 0, `npx tsc --noEmit` ✅ exit 0, `npm run build` ✅ sin errores. Revisión visual en navegador real (`npm run dev`): DigiProy intacto, fila nueva se ve correcta, los 3 tabs cambian de imagen sin overflow, consola sin errores. No se pudo forzar un viewport móvil real con las herramientas de este entorno (limitación ya conocida) — el comportamiento responsive se verificó por código (el grid nuevo no define columnas por debajo de `lg`, mismo patrón que ya usaba el grid original).

**Estado:** implementación completa, dev server dejado corriendo en `http://localhost:3000/#projects` para que el usuario haga su propia revisión visual final. **Sin commit** — a la espera de aprobación explícita del usuario antes de commitear en el repo del portfolio.

## Cierre de sesión (2026-09-10) — cierre de repositorio para portafolio

Objetivo de la sesión: dejar `feat/finance-api-complete` limpia y lista para portafolio tras el despliegue en producción, sin tocar `V2` y sin merge/rebase/reset/force push. Todo ejecutado paso a paso con diff mostrado y confirmación explícita del usuario antes de cada commit.

**Paso 1 — publicar el commit de docs pendiente:**
- `b669190` (docs: update status — auditoría de despliegue en producción) estaba commiteado local pero no pusheado. `git push` (fast-forward simple) lo publicó. Verificado `origin/feat/finance-api-complete` == `HEAD` local tras el push.

**Paso 2 — script de seed de QA:**
- Revisión estática (sin ejecutar el script, por decisión explícita del usuario: el `.env` local apunta al mismo proyecto Supabase de producción documentado abajo, y correrlo habría escrito contra esa base compartida).
- Confirmado por lectura de código que `apps/api/prisma/seed-qa.ts` es idempotente: usuarios por `upsert` (email único), catálogo por `findFirst`+`create` (sin duplicar en reruns), permisos por `upsert` (clave compuesta única), y documentos financieros (compras/facturas/presupuestos/contratos) se saltean en bloque si ya existen (chequeo sobre `cliente1`).
- Confirmado que `apps/api/package.json` solo agrega la línea `"prisma:seed:qa": "ts-node prisma/seed-qa.ts"` a `scripts`; el bloque `"prisma": { "seed": "ts-node prisma/seed.ts" }` (usado por `prisma db seed` / `prisma migrate dev`) queda intacto.
- Commit `97858ab` (`chore(api): add idempotent QA seed script`) con únicamente esos dos archivos, pusheado a `origin/feat/finance-api-complete`.

**Paso 3 — limpieza de debris temporal:**
- Confirmado por grep en todo el repo (código, `package.json` de ambas apps, imports) que `apps/web/_print_batch.js`, `batch_plan.json`, `chunks_meta.json`, `deploy_files.json` y `deploy_files_trimmed.json` no tenían ninguna referencia fuera de sí mismos y de este documento — eran debris de una sesión anterior (dumps de contenido fuente y un script ad-hoc para paginarlos), fuera del árbol de rutas de Next.js (`apps/web/_print_batch.js` vive en la raíz de `apps/web`, no en `app/`).
- Eliminados del disco. **No generaron commit**: los 5 archivos nunca estuvieron trackeados por git (eran `??` en `git status` desde el inicio de la sesión), así que no había nada que commitear ni pushear para su borrado — solo desaparecieron de la lista de untracked.
- No se tocó `Dashboard - Auditoría y Conceptos.dc.html` (excluido a propósito, por instrucción explícita).

**Resultado final de la sesión:**
- 2 commits nuevos pusheados a `origin/feat/finance-api-complete`: `b669190` → `97858ab`.
- Working tree limpio salvo el único archivo suelto intencional (`Dashboard - Auditoría y Conceptos.dc.html`) y los `package-lock.json` (excluidos por decisión previa del usuario, ver Notas importantes).
- `V2` intacta: no se ejecutó ningún `merge`/`rebase`/`reset`/`force push` en toda la sesión; solo `git push` fast-forward sobre `feat/finance-api-complete`.

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
