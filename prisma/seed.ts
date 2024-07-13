import { PrismaClient, permissionTypes } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
  { name: permissionTypes.CREATE_USER, description: "Permitir crear nuevos usuarios" },
  { name: permissionTypes.READ_USER, description: "Permitir leer información de usuarios" },
  { name: permissionTypes.UPDATE_USER, description: "Permitir actualizar información de usuarios" },
  { name: permissionTypes.DELETE_USER, description: "Permitir eliminar usuarios" },
  { name: permissionTypes.READ_USER_DETAILS, description: "Permitir leer detalles de usuario" },
  { name: permissionTypes.UPDATE_USER_DETAILS, description: "Permitir actualizar detalles de usuario" },
  { name: permissionTypes.CREATE_PRODUCT, description: "Permitir crear nuevos productos" },
  { name: permissionTypes.READ_PRODUCT, description: "Permitir leer información de productos" },
  { name: permissionTypes.UPDATE_PRODUCT, description: "Permitir actualizar información de productos" },
  { name: permissionTypes.DELETE_PRODUCT, description: "Permitir eliminar productos" },
  { name: permissionTypes.CREATE_PURCHASE, description: "Permitir crear nuevas compras" },
  { name: permissionTypes.READ_PURCHASE, description: "Permitir leer información de compras" },
  { name: permissionTypes.UPDATE_PURCHASE, description: "Permitir actualizar información de compras" },
  { name: permissionTypes.DELETE_PURCHASE, description: "Permitir eliminar compras" },
  { name: permissionTypes.CREATE_INVOICE, description: "Permitir crear nuevas facturas" },
  { name: permissionTypes.READ_INVOICE, description: "Permitir leer información de facturas" },
  { name: permissionTypes.UPDATE_INVOICE, description: "Permitir actualizar información de facturas" },
  { name: permissionTypes.DELETE_INVOICE, description: "Permitir eliminar facturas" },
  { name: permissionTypes.CREATE_BUDGET, description: "Permitir crear nuevos presupuestos" },
  { name: permissionTypes.READ_BUDGET, description: "Permitir leer información de presupuestos" },
  { name: permissionTypes.UPDATE_BUDGET, description: "Permitir actualizar información de presupuestos" },
  { name: permissionTypes.DELETE_BUDGET, description: "Permitir eliminar presupuestos" },
  { name: permissionTypes.READ_ADMIN_PANEL, description: "Permitir acceso al panel de administración" },
  { name: permissionTypes.UPDATE_SETTINGS, description: "Permitir actualizar configuraciones del sistema" },
  { name: permissionTypes.VIEW_REPORTS, description: "Permitir ver reportes y análisis" },
  { name: permissionTypes.EXPORT_DATA, description: "Permitir exportar datos del sistema" },
  { name: permissionTypes.ASSIGN_ROLE, description: "Permitir asignar roles a los usuarios" },
  { name: permissionTypes.VIEW_ACTIVITY_LOG, description: "Permitir ver el registro de actividades del sistema" }
];

async function main() {
  for (const permission of permissions) {
    await prisma.permissions.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
