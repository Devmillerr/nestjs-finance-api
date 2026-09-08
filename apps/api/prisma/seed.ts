import { PrismaClient, PermissionName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Rondas de bcrypt: mismo valor que auth.service.ts (BCRYPT_ROUNDS). Se
// duplica acá a propósito -- este script corre standalone via `ts-node`,
// fuera del contexto de Nest, así que no vale la pena compartir el import
// por una sola constante.
const BCRYPT_ROUNDS = 12;

// `Permission` es una tabla aparte del enum `PermissionName` (UserPermission
// referencia el id de una fila real). Sin este seed, otorgar cualquier
// permiso falla porque la fila todavía no existe -- este seed es lo que
// hace que /users/:id/permissions sea usable en una base nueva.
const PERMISSION_DESCRIPTIONS: Record<PermissionName, string> = {
  CREATE_USER: 'Crear usuarios',
  READ_USER: 'Ver usuarios',
  UPDATE_USER: 'Editar usuarios',
  DELETE_USER: 'Desactivar usuarios',
  READ_USER_DETAILS: 'Ver detalles de perfil de usuarios',
  UPDATE_USER_DETAILS: 'Editar detalles de perfil de usuarios',
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
  ALL_PERMISSION:
    'Comodín: equivale a tener todos los permisos (ver PermissionsGuard)',
};

async function seedPermissions() {
  const entries = Object.entries(PERMISSION_DESCRIPTIONS) as [
    PermissionName,
    string,
  ][];

  for (const [name, description] of entries) {
    await prisma.permission.upsert({
      where: { name },
      update: { description },
      create: { name, description },
    });
  }

  console.log(`Permisos sembrados: ${entries.length}`);
}

async function seedOwner() {
  const email = process.env.SEED_OWNER_EMAIL;
  const password = process.env.SEED_OWNER_PASSWORD;

  if (!email || !password) {
    console.warn(
      'SEED_OWNER_EMAIL / SEED_OWNER_PASSWORD no están seteadas -- se omite ' +
        'la creación del usuario OWNER inicial. Sin esto, no hay forma de ' +
        'acceder a ninguna ruta @Roles(\'ADMIN\', \'OWNER\') en una base nueva.',
    );
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`El usuario OWNER "${email}" ya existe -- no se recrea.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await prisma.user.create({
    data: { email, passwordHash, role: 'OWNER' },
  });
  console.log(`Usuario OWNER creado: ${email}`);
}

async function main() {
  await seedPermissions();
  await seedOwner();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
