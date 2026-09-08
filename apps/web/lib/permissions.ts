// Catálogo completo del enum PermissionName (prisma/schema.prisma) y sus
// labels en español -- duplica PERMISSION_DESCRIPTIONS de
// apps/api/prisma/seed.ts a propósito, mismo criterio que ya usa el proyecto
// para constantes chicas que viven en dominios distintos (ver
// UNPAID_STATUSES en dashboard/page.tsx vs dashboard.service.ts).
//
// Nota: lib/nav.ts define su propio tipo `PermissionName` con solo los 8
// valores relevantes para gating de navegación -- este es el catálogo
// completo, para la UI de otorgar/revocar en users/[id].
export type AllPermissionName =
  | 'CREATE_USER'
  | 'READ_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER'
  | 'READ_USER_DETAILS'
  | 'UPDATE_USER_DETAILS'
  | 'CREATE_PRODUCT'
  | 'READ_PRODUCT'
  | 'UPDATE_PRODUCT'
  | 'DELETE_PRODUCT'
  | 'CREATE_PURCHASE'
  | 'READ_PURCHASE'
  | 'UPDATE_PURCHASE'
  | 'DELETE_PURCHASE'
  | 'CREATE_INVOICE'
  | 'READ_INVOICE'
  | 'UPDATE_INVOICE'
  | 'DELETE_INVOICE'
  | 'CREATE_BUDGET'
  | 'READ_BUDGET'
  | 'UPDATE_BUDGET'
  | 'DELETE_BUDGET'
  | 'READ_ADMIN_PANEL'
  | 'UPDATE_SETTINGS'
  | 'MANAGE_ROLES'
  | 'VIEW_REPORTS'
  | 'EXPORT_DATA'
  | 'ASSIGN_ROLE'
  | 'VIEW_ACTIVITY_LOG'
  | 'ALL_PERMISSION';

export const PERMISSION_LABELS: Record<AllPermissionName, string> = {
  CREATE_USER: 'Crear usuarios',
  READ_USER: 'Ver usuarios',
  UPDATE_USER: 'Editar usuarios',
  DELETE_USER: 'Desactivar usuarios',
  READ_USER_DETAILS: 'Ver detalles de perfil',
  UPDATE_USER_DETAILS: 'Editar detalles de perfil',
  CREATE_PRODUCT: 'Crear productos del catálogo',
  READ_PRODUCT: 'Ver productos del catálogo',
  UPDATE_PRODUCT: 'Editar productos del catálogo',
  DELETE_PRODUCT: 'Eliminar productos del catálogo',
  CREATE_PURCHASE: 'Crear compras',
  READ_PURCHASE: 'Ver compras',
  UPDATE_PURCHASE: 'Editar estado de compras',
  DELETE_PURCHASE: 'Eliminar compras',
  CREATE_INVOICE: 'Crear facturas',
  READ_INVOICE: 'Ver facturas',
  UPDATE_INVOICE: 'Editar estado de facturas',
  DELETE_INVOICE: 'Eliminar facturas',
  CREATE_BUDGET: 'Crear presupuestos',
  READ_BUDGET: 'Ver presupuestos',
  UPDATE_BUDGET: 'Editar presupuestos',
  DELETE_BUDGET: 'Eliminar presupuestos',
  READ_ADMIN_PANEL: 'Acceder al panel de administración',
  UPDATE_SETTINGS: 'Editar configuración del sistema',
  MANAGE_ROLES: 'Gestionar roles de usuarios',
  VIEW_REPORTS: 'Ver reportes y estadísticas',
  EXPORT_DATA: 'Exportar datos',
  ASSIGN_ROLE: 'Asignar roles a usuarios',
  VIEW_ACTIVITY_LOG: 'Ver el registro de actividad',
  ALL_PERMISSION: 'Comodín: todos los permisos',
};

export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as AllPermissionName[];
