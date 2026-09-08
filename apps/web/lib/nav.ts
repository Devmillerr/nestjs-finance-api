import {
  Gauge,
  Receipt,
  ClipboardList,
  ShoppingCart,
  Package,
  Wrench,
  Users,
  Handshake,
  type LucideIcon,
} from 'lucide-react';

// Fuente única de navegación.
//
// Antes esta lista vivía duplicada en components/layout/sidebar.tsx
// (NAV_ITEMS) y en components/command-palette.tsx (DESTINATIONS), y las dos
// ya habían divergido: la palette tenía un comentario explicando que
// Presupuestos "no está en el sidebar" cuando sí estaba. Cualquier sección
// nueva se agrega acá y aparece en los dos lugares.
//
// Solo se listan rutas que existen en app/dashboard/. Las tres entradas que
// antes se renderizaban deshabilitadas con la etiqueta "pronto"
// (transactions, reports, settings) no tienen página, así que se retiran:
// eran 40% de una navegación que no llevaba a ningún lado.

/** Coincide con el enum PermissionName de prisma/schema.prisma. */
export type PermissionName =
  | 'READ_USER'
  | 'READ_PRODUCT'
  | 'READ_PURCHASE'
  | 'READ_INVOICE'
  | 'READ_BUDGET'
  | 'READ_ADMIN_PANEL'
  | 'VIEW_REPORTS'
  | 'ALL_PERMISSION';

/** Coincide con el enum Role de prisma/schema.prisma. */
export type Role = 'USER' | 'TEAM' | 'ADMIN' | 'OWNER';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Permiso que habilita la sección. Ver nota sobre gating más abajo. */
  permission: PermissionName;
  /**
   * Clave del contador que el ítem muestra a la derecha. La navegación no
   * conoce datos: el layout pasa los valores y esto solo dice cuál leer.
   * Se llena cuando existan los endpoints de agregados (PR 3).
   */
  badgeKey?: 'invoicesOverdue' | 'purchasesOpen' | 'budgetsOpen';
  /** El contador se pinta en color de riesgo en vez de neutro. */
  badgeTone?: 'neutral' | 'warning';
}

export interface NavGroup {
  /** null = grupo sin encabezado (el primer cluster). */
  heading: string | null;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    heading: null,
    items: [
      { href: '/dashboard', label: 'Cabina', icon: Gauge, permission: 'READ_INVOICE' },
    ],
  },
  {
    heading: 'Facturación',
    items: [
      {
        href: '/dashboard/invoices',
        label: 'Facturas',
        icon: Receipt,
        permission: 'READ_INVOICE',
        badgeKey: 'invoicesOverdue',
        badgeTone: 'warning',
      },
      {
        href: '/dashboard/budgets',
        label: 'Presupuestos',
        icon: ClipboardList,
        permission: 'READ_BUDGET',
        badgeKey: 'budgetsOpen',
      },
    ],
  },
  {
    heading: 'Operación',
    items: [
      {
        href: '/dashboard/purchases',
        label: 'Compras',
        icon: ShoppingCart,
        permission: 'READ_PURCHASE',
        badgeKey: 'purchasesOpen',
      },
      {
        // El enum PermissionName de prisma/schema.prisma no tiene un permiso
        // dedicado a contratos de servicio -- se reutiliza READ_PURCHASE como
        // el más cercano (mismo dominio: registros operativos por cliente).
        // El gating sigue inerte (ver canSee más abajo), así que esto no
        // tiene efecto funcional hoy.
        href: '/dashboard/service-contracts',
        label: 'Contratos',
        icon: Handshake,
        permission: 'READ_PURCHASE',
      },
    ],
  },
  {
    heading: 'Catálogo',
    items: [
      { href: '/dashboard/products', label: 'Productos', icon: Package, permission: 'READ_PRODUCT' },
      { href: '/dashboard/services', label: 'Servicios', icon: Wrench, permission: 'READ_PRODUCT' },
    ],
  },
  {
    heading: 'Administración',
    items: [
      { href: '/dashboard/users', label: 'Usuarios', icon: Users, permission: 'READ_USER' },
    ],
  },
];

/** Lista plana, en el orden en que se muestran. La usa la command palette. */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Título y subtítulo del topbar por ruta. */
export function navTitleFor(pathname: string): { title: string; subtitle?: string } {
  const exact = NAV_ITEMS.find((i) => i.href === pathname);
  if (exact) {
    return exact.href === '/dashboard'
      ? { title: 'Cabina', subtitle: 'Resumen de la posición financiera' }
      : { title: exact.label };
  }
  // Rutas de detalle (/dashboard/invoices/[id]): hereda el título de su sección.
  const parent = NAV_ITEMS.filter((i) => i.href !== '/dashboard').find((i) =>
    pathname.startsWith(`${i.href}/`),
  );
  return parent ? { title: parent.label } : { title: 'Cabina' };
}

export interface NavViewer {
  role?: Role | null;
  permissions?: PermissionName[] | null;
}

function canSee(item: NavItem, viewer: NavViewer | null | undefined): boolean {
  // El access token en sí sigue trayendo solo { sub, email, iat, exp } (ver
  // lib/jwt.ts) -- el viewer viene de GET /auth/me (ver auth-provider.tsx),
  // resuelto por el backend en cada carga de sesión. Mientras esa respuesta
  // no llegó todavía (o falló), viewer es null y se muestra todo -- nunca se
  // oculta una sección por error de red, solo por rol/permiso confirmado.
  //
  // Esto es solo presentación: el backend revalida permisos en cada request.
  if (!viewer) return true;
  const { role, permissions } = viewer;
  if (!role && !permissions) return true;
  if (role === 'OWNER' || role === 'ADMIN') return true;
  if (!permissions) return true;
  return permissions.includes('ALL_PERMISSION') || permissions.includes(item.permission);
}

/** Grupos visibles para el usuario actual, sin grupos que queden vacíos. */
export function navGroupsFor(viewer?: NavViewer | null): NavGroup[] {
  return NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => canSee(i, viewer)) })).filter(
    (g) => g.items.length > 0,
  );
}

/** Ítem activo para un pathname, incluyendo rutas de detalle. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.href === '/dashboard') return pathname === '/dashboard';
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
