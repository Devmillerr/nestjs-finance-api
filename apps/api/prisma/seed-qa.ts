// Seed de datos de QA -- NO forma parte del seed base (prisma/seed.ts, el que
// corre `npx prisma db seed`). Se invoca aparte, a propósito, con
// `npm run prisma:seed:qa`, para que nunca se dispare sin querer contra un
// entorno real (CI, staging, producción).
//
// Genera un set de usuarios/clientes/catálogo/documentos financieros
// reutilizable para QA manual: 11 usuarios bajo el dominio reservado
// `@qa.financeapi.test` (RFC 2606 -- nunca resuelve, imposible de confundir
// con un email real), cubriendo los 5 perfiles pedidos (OWNER, ADMIN, USER
// operativo, USER con permisos limitados, usuario inactivo) más equipo (TEAM)
// y clientes adicionales, con facturas/cargos/compras/presupuestos/contratos
// relacionados entre sí.
//
// Idempotente: los usuarios y el catálogo se upsertean/buscan por nombre en
// cada corrida (seguro re-ejecutar). Los documentos financieros (compras,
// facturas, presupuestos, contratos) se saltean por completo si ya existen
// -- no hay una key de negocio natural para deduplicarlos uno por uno, así
// que la corrida completa se vuelve un no-op después de la primera vez.
import {
  PrismaClient,
  Role,
  ProductType,
  PaymentMethod,
  PaymentStatus,
  ChargeType,
  ContractStatus,
  PermissionName,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Mismo valor que auth.service.ts / prisma/seed.ts -- se duplica a propósito,
// este script corre standalone vía ts-node, fuera del contexto de Nest.
const BCRYPT_ROUNDS = 12;

// Contraseña de QA, no de producción: fija y documentada para que cualquiera
// pueda loguearse con los usuarios de prueba sin tener que buscarla en otro
// lado. Override opcional por env si alguien la quiere distinta en su máquina.
const QA_PASSWORD = process.env.QA_SEED_PASSWORD ?? 'QaFinance#2026';
const EMAIL_DOMAIN = 'qa.financeapi.test';

const DAY_MS = 86_400_000;
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * DAY_MS);
}
function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * DAY_MS);
}
function placeholderImage(seed: string): string {
  return `https://picsum.photos/seed/${seed}/640/360`;
}

// ── Usuarios ────────────────────────────────────────────────────────────

interface QaUserSpec {
  key: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname: string;
  role: Role;
  isActive?: boolean;
  phone: string;
  address: string;
  zipCode: string;
}

const QA_USERS: QaUserSpec[] = [
  {
    key: 'owner',
    email: `qa.owner@${EMAIL_DOMAIN}`,
    firstName: 'Valentina',
    lastName: 'Rojas',
    nickname: 'QA Owner',
    role: 'OWNER',
    phone: '+51 987 111 001',
    address: 'Av. Ficticia 100, San Isidro, Lima',
    zipCode: '15046',
  },
  {
    key: 'admin',
    email: `qa.admin@${EMAIL_DOMAIN}`,
    firstName: 'Mateo',
    lastName: 'Fernández',
    nickname: 'QA Admin',
    role: 'ADMIN',
    phone: '+51 987 111 002',
    address: 'Av. Ficticia 200, Miraflores, Lima',
    zipCode: '15074',
  },
  {
    key: 'user',
    email: `qa.user@${EMAIL_DOMAIN}`,
    firstName: 'Camila',
    lastName: 'Torres',
    nickname: 'QA Usuario Operativo',
    role: 'USER',
    phone: '+51 987 111 003',
    address: 'Av. Ficticia 300, Surco, Lima',
    zipCode: '15038',
  },
  {
    key: 'limited',
    email: `qa.limited@${EMAIL_DOMAIN}`,
    firstName: 'Diego',
    lastName: 'Salazar',
    nickname: 'QA Usuario Limitado',
    role: 'USER',
    phone: '+51 987 111 004',
    address: 'Av. Ficticia 400, Barranco, Lima',
    zipCode: '15063',
  },
  {
    key: 'inactive',
    email: `qa.inactive@${EMAIL_DOMAIN}`,
    firstName: 'Renata',
    lastName: 'Cabrera',
    nickname: 'QA Inactivo',
    role: 'USER',
    isActive: false,
    phone: '+51 987 111 005',
    address: 'Av. Ficticia 500, Pueblo Libre, Lima',
    zipCode: '15084',
  },
  {
    key: 'team1',
    email: `qa.team1@${EMAIL_DOMAIN}`,
    firstName: 'Joaquín',
    lastName: 'Medina',
    nickname: 'QA Equipo Uno',
    role: 'TEAM',
    phone: '+51 987 111 006',
    address: 'Av. Ficticia 600, Jesús María, Lima',
    zipCode: '15072',
  },
  {
    key: 'team2',
    email: `qa.team2@${EMAIL_DOMAIN}`,
    firstName: 'Sofía',
    lastName: 'Herrera',
    nickname: 'QA Equipo Dos',
    role: 'TEAM',
    phone: '+51 987 111 007',
    address: 'Av. Ficticia 700, Magdalena, Lima',
    zipCode: '15092',
  },
  {
    key: 'cliente1',
    email: `qa.cliente1@${EMAIL_DOMAIN}`,
    firstName: 'Lucía',
    lastName: 'Paredes',
    nickname: 'QA Cliente Uno',
    role: 'USER',
    phone: '+51 987 111 008',
    address: 'Av. Ficticia 800, La Molina, Lima',
    zipCode: '15026',
  },
  {
    key: 'cliente2',
    email: `qa.cliente2@${EMAIL_DOMAIN}`,
    firstName: 'Andrés',
    lastName: 'Vidal',
    nickname: 'QA Cliente Dos',
    role: 'USER',
    phone: '+51 987 111 009',
    address: 'Av. Ficticia 900, San Borja, Lima',
    zipCode: '15037',
  },
  {
    key: 'cliente3',
    email: `qa.cliente3@${EMAIL_DOMAIN}`,
    firstName: 'Martina',
    lastName: 'Aguilar',
    nickname: 'QA Cliente Tres',
    role: 'USER',
    phone: '+51 987 111 010',
    address: 'Av. Ficticia 1000, Chorrillos, Lima',
    zipCode: '15057',
  },
  {
    key: 'cliente4',
    email: `qa.cliente4@${EMAIL_DOMAIN}`,
    firstName: 'Bruno',
    lastName: 'Castañeda',
    nickname: 'QA Cliente Cuatro',
    role: 'USER',
    phone: '+51 987 111 011',
    address: 'Av. Ficticia 1100, Los Olivos, Lima',
    zipCode: '15304',
  },
];

async function upsertQaUser(spec: QaUserSpec) {
  const passwordHash = await bcrypt.hash(QA_PASSWORD, BCRYPT_ROUNDS);
  const detailsData = {
    firstName: spec.firstName,
    lastName: spec.lastName,
    nickname: spec.nickname,
    phone: spec.phone,
    address: spec.address,
    zipCode: spec.zipCode,
  };

  return prisma.user.upsert({
    where: { email: spec.email },
    update: {
      role: spec.role,
      isActive: spec.isActive ?? true,
      passwordHash,
      details: { upsert: { update: detailsData, create: detailsData } },
    },
    create: {
      email: spec.email,
      passwordHash,
      role: spec.role,
      isActive: spec.isActive ?? true,
      details: { create: detailsData },
    },
  });
}

// ── Catálogo ────────────────────────────────────────────────────────────

interface QaProductSpec {
  name: string;
  description: string;
  priceCents: number;
  type: ProductType;
}

const QA_PRODUCTS: QaProductSpec[] = [
  {
    name: 'Sitio Web Corporativo QA',
    description: 'Sitio institucional de hasta 8 páginas, responsive.',
    priceCents: 45000,
    type: 'WEB',
  },
  {
    name: 'Landing Page QA',
    description: 'Página única de conversión con formulario de contacto.',
    priceCents: 15000,
    type: 'WEB',
  },
  {
    name: 'Tienda Online QA',
    description: 'E-commerce con catálogo, carrito y pasarela de pago.',
    priceCents: 80000,
    type: 'WEB',
  },
  {
    name: 'Servidor FiveM Starter QA',
    description: 'Servidor FiveM configurado, hasta 32 slots.',
    priceCents: 25000,
    type: 'FIVEM',
  },
  {
    name: 'Servidor FiveM Pro QA',
    description: 'Servidor FiveM con scripts a medida, hasta 128 slots.',
    priceCents: 60000,
    type: 'FIVEM',
  },
  {
    name: 'Bot de Discord Moderación QA',
    description: 'Bot de moderación automática y logs.',
    priceCents: 12000,
    type: 'DISCORD_BOT',
  },
  {
    name: 'Bot de Discord Economía QA',
    description: 'Bot de economía virtual y niveles.',
    priceCents: 18000,
    type: 'DISCORD_BOT',
  },
];

interface QaServiceSpec {
  name: string;
  description: string;
  priceCents: number;
}

const QA_SERVICES: QaServiceSpec[] = [
  {
    name: 'Mantenimiento Web Mensual QA',
    description: 'Actualizaciones, backups y monitoreo mensual.',
    priceCents: 20000,
  },
  {
    name: 'Soporte FiveM 24/7 QA',
    description: 'Soporte técnico continuo para servidores FiveM.',
    priceCents: 35000,
  },
  {
    name: 'Gestión de Bot Discord QA',
    description: 'Configuración y mantenimiento continuo del bot.',
    priceCents: 15000,
  },
  {
    name: 'Consultoría Técnica QA',
    description: 'Sesión de consultoría de arquitectura, por mes.',
    priceCents: 50000,
  },
  {
    name: 'Hosting Administrado QA',
    description: 'Hosting con administración y monitoreo incluido.',
    priceCents: 22000,
  },
];

async function findOrCreateProduct(spec: QaProductSpec) {
  const existing = await prisma.product.findFirst({
    where: { name: spec.name },
  });
  if (existing) return existing;
  return prisma.product.create({
    data: { ...spec, photoUrl: placeholderImage(spec.name) },
  });
}

async function findOrCreateService(spec: QaServiceSpec) {
  const existing = await prisma.service.findFirst({
    where: { name: spec.name },
  });
  if (existing) return existing;
  return prisma.service.create({
    data: { ...spec, photoUrl: placeholderImage(spec.name) },
  });
}

// ── Permisos (usuario "limitado") ──────────────────────────────────────

async function ensurePermission(name: PermissionName) {
  return prisma.permission.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

// PermissionsGuard/@RequirePermissions() existen pero ningún endpoint los usa
// todavía (solo @Roles()) -- otorgar esto no desbloquea nada en la API hoy,
// pero sirve para probar la UI real de otorgar/revocar permisos.
async function grantQaPermissions(limitedUserId: string) {
  const permNames: PermissionName[] = [
    'READ_INVOICE',
    'READ_PURCHASE',
    'VIEW_REPORTS',
  ];
  for (const name of permNames) {
    const permission = await ensurePermission(name);
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId: limitedUserId,
          permissionId: permission.id,
        },
      },
      update: {},
      create: { userId: limitedUserId, permissionId: permission.id },
    });
  }
  return permNames;
}

// ── Compras ─────────────────────────────────────────────────────────────

const PAYMENT_METHODS: PaymentMethod[] = ['PAYPAL', 'STRIPE', 'CRYPTO'];
const PAYMENT_STATUSES: PaymentStatus[] = [
  'COMPLETED',
  'PENDING',
  'NOT_COMPLETED',
  'CANCELED',
];
const CLIENT_KEYS = [
  'user',
  'limited',
  'cliente1',
  'cliente2',
  'cliente3',
  'cliente4',
];

async function seedPurchases(
  byKey: Record<string, { id: string }>,
  products: { id: string; priceCents: number }[],
) {
  const count = 16;
  for (let i = 0; i < count; i++) {
    const client = byKey[CLIENT_KEYS[i % CLIENT_KEYS.length]];
    const lineCount = 1 + (i % 3);
    const lines = Array.from({ length: lineCount }, (_, j) => {
      const product = products[(i + j) % products.length];
      const quantity = 1 + ((i + j) % 3);
      return {
        productId: product.id,
        quantity,
        unitPriceCents: product.priceCents,
      };
    });
    const totalCents = lines.reduce(
      (sum, l) => sum + l.unitPriceCents * l.quantity,
      0,
    );
    const createdAt = daysAgo(2 + i * 4);

    await prisma.purchase.create({
      data: {
        clientId: client.id,
        paymentMethod: PAYMENT_METHODS[i % PAYMENT_METHODS.length],
        paymentStatus: PAYMENT_STATUSES[i % PAYMENT_STATUSES.length],
        totalCents,
        createdAt,
        updatedAt: createdAt,
        lines: { create: lines },
      },
    });
  }
  return count;
}

// ── Facturas ────────────────────────────────────────────────────────────

// Cinco "buckets" de fecha/estado para que el dashboard tenga algo real que
// mostrar: vencidas sin pagar, por vencer en 30 días, pagadas recientes,
// canceladas, y unas viejas (fuera de la ventana de "mes", visibles al
// cambiar a "trimestre"/"año").
function invoiceBucket(i: number): {
  paymentStatus: PaymentStatus;
  createdAt: Date;
  expiration: Date;
} {
  switch (i % 5) {
    case 0:
      return {
        paymentStatus: 'PENDING',
        createdAt: daysAgo(45),
        expiration: daysAgo(10),
      };
    case 1:
      return {
        paymentStatus: 'NOT_COMPLETED',
        createdAt: daysAgo(5),
        expiration: daysFromNow(7 + i),
      };
    case 2:
      return {
        paymentStatus: 'COMPLETED',
        createdAt: daysAgo(3 + i),
        expiration: daysFromNow(20),
      };
    case 3:
      return {
        paymentStatus: 'CANCELED',
        createdAt: daysAgo(15 + i),
        expiration: daysFromNow(15),
      };
    default:
      return {
        paymentStatus: 'COMPLETED',
        createdAt: daysAgo(60 + i * 2),
        expiration: daysAgo(40 + i),
      };
  }
}

async function seedInvoices(
  byKey: Record<string, { id: string }>,
  products: {
    id: string;
    name: string;
    description: string;
    priceCents: number;
  }[],
  services: {
    id: string;
    name: string;
    description: string;
    priceCents: number;
  }[],
) {
  const count = 16;
  let chargeCount = 0;
  for (let i = 0; i < count; i++) {
    const client = byKey[CLIENT_KEYS[i % CLIENT_KEYS.length]];
    const lineCount = 1 + (i % 3);
    const lines = Array.from({ length: lineCount }, (_, j) => {
      if (j % 2 === 0) {
        const p = products[(i + j) % products.length];
        return {
          name: p.name,
          description: p.description,
          priceCents: p.priceCents,
          productId: p.id,
        };
      }
      const s = services[(i + j) % services.length];
      return {
        name: s.name,
        description: s.description,
        priceCents: s.priceCents,
        serviceId: s.id,
      };
    });

    const charges: { type: ChargeType; amountCents: number }[] = [];
    if (i % 3 === 0) charges.push({ type: 'DISCOUNT', amountCents: 2000 });
    if (i % 4 === 0) charges.push({ type: 'TAX', amountCents: 1500 });
    chargeCount += charges.length;

    const { paymentStatus, createdAt, expiration } = invoiceBucket(i);

    await prisma.invoice.create({
      data: {
        clientId: client.id,
        paymentMethod: PAYMENT_METHODS[i % PAYMENT_METHODS.length],
        paymentStatus,
        expiration,
        createdAt,
        updatedAt: createdAt,
        lines: { create: lines },
        charges: charges.length ? { create: charges } : undefined,
      },
    });
  }
  return { invoiceCount: count, chargeCount };
}

// ── Presupuestos ────────────────────────────────────────────────────────

const BUDGET_DESCRIPTIONS = [
  'Propuesta sitio institucional',
  'Cotización servidor FiveM',
  'Presupuesto bot de Discord',
  'Propuesta tienda online',
  'Cotización mantenimiento mensual',
  'Presupuesto migración de hosting',
];

async function seedBudgets(
  byKey: Record<string, { id: string }>,
  products: {
    id: string;
    name: string;
    description: string;
    priceCents: number;
  }[],
) {
  const count = 12;
  for (let i = 0; i < count; i++) {
    const client = byKey[CLIENT_KEYS[i % CLIENT_KEYS.length]];
    const lineCount = 1 + (i % 2);
    const lines = Array.from({ length: lineCount }, (_, j) => {
      const p = products[(i + j) % products.length];
      return {
        title: p.name,
        description: p.description,
        priceCents: p.priceCents,
        productId: p.id,
      };
    });
    const createdAt = daysAgo(1 + i * 3);

    await prisma.budget.create({
      data: {
        clientId: client.id,
        description: BUDGET_DESCRIPTIONS[i % BUDGET_DESCRIPTIONS.length],
        createdAt,
        updatedAt: createdAt,
        lines: { create: lines },
      },
    });
  }
  return count;
}

// ── Contratos de servicio ───────────────────────────────────────────────

const CONTRACT_STATUSES: ContractStatus[] = [
  'ACTIVE',
  'PENDING',
  'COMPLETED',
  'CANCELED',
  'INACTIVE',
];

async function seedServiceContracts(
  byKey: Record<string, { id: string }>,
  services: { id: string; name: string; priceCents: number }[],
) {
  const count = 10;
  const teamPool = ['team1', 'team2', 'admin'].map((k) => byKey[k]);
  let assignmentCount = 0;

  for (let i = 0; i < count; i++) {
    const client = byKey[CLIENT_KEYS[i % CLIENT_KEYS.length]];
    const service = services[i % services.length];
    const status = CONTRACT_STATUSES[i % CONTRACT_STATUSES.length];
    const startDate = daysAgo(5 + i * 6);
    const endDate =
      status === 'COMPLETED' || status === 'CANCELED' ? daysAgo(1 + i) : null;

    const contract = await prisma.serviceContract.create({
      data: {
        clientId: client.id,
        serviceId: service.id,
        name: service.name,
        priceCents: service.priceCents,
        status,
        startDate,
        endDate,
        notes:
          i % 3 === 0
            ? 'Cliente pidió seguimiento mensual por email.'
            : undefined,
        createdAt: startDate,
        updatedAt: startDate,
      },
    });

    // No todos los contratos tienen equipo asignado a propósito -- deja
    // también casos de "sin nadie asignado" para probar ese estado vacío.
    if (i % 4 !== 3) {
      const assignee = teamPool[i % teamPool.length];
      await prisma.serviceAssignment.create({
        data: { serviceContractId: contract.id, userId: assignee.id },
      });
      assignmentCount++;

      const secondAssignee = teamPool[(i + 1) % teamPool.length];
      if (i % 5 === 0 && secondAssignee.id !== assignee.id) {
        await prisma.serviceAssignment.create({
          data: { serviceContractId: contract.id, userId: secondAssignee.id },
        });
        assignmentCount++;
      }
    }
  }
  return { contractCount: count, assignmentCount };
}

// ── Orquestación ────────────────────────────────────────────────────────

async function printSummary(grantedPermissions: PermissionName[]) {
  const userRows = await prisma.user.findMany({
    where: { email: { endsWith: `@${EMAIL_DOMAIN}` } },
    select: {
      email: true,
      role: true,
      isActive: true,
      permissions: { select: { permission: { select: { name: true } } } },
    },
    orderBy: { email: 'asc' },
  });

  const [
    qaClientCount,
    productCount,
    serviceCount,
    purchaseCount,
    invoiceCount,
    chargeCount,
    budgetCount,
    contractCount,
  ] = await Promise.all([
    prisma.user.count({
      where: { email: { endsWith: `@${EMAIL_DOMAIN}` }, role: 'USER' },
    }),
    prisma.product.count(),
    prisma.service.count(),
    prisma.purchase.count(),
    prisma.invoice.count(),
    prisma.invoiceCharge.count(),
    prisma.budget.count(),
    prisma.serviceContract.count(),
  ]);

  console.log('\n=== Resumen de datos de QA ===');
  console.log('Usuarios QA (@' + EMAIL_DOMAIN + '):');
  for (const u of userRows) {
    const perms = u.permissions.map((p) => p.permission.name).join(', ') || '—';
    console.log(
      `  ${u.email} | rol=${u.role} | activo=${u.isActive} | permisos extra=${perms}`,
    );
  }
  console.log(
    `\nUsuarios QA con rol USER (potenciales "clientes"): ${qaClientCount}`,
  );
  console.log(`Productos en catálogo (total DB): ${productCount}`);
  console.log(`Servicios en catálogo (total DB): ${serviceCount}`);
  console.log(`Compras (total DB): ${purchaseCount}`);
  console.log(`Facturas (total DB): ${invoiceCount}`);
  console.log(`Cargos de factura (total DB): ${chargeCount}`);
  console.log(`Presupuestos (total DB): ${budgetCount}`);
  console.log(`Contratos de servicio (total DB): ${contractCount}`);
  console.log(
    `Permisos extra otorgados a qa.limited: ${grantedPermissions.join(', ')}`,
  );
  console.log(
    `\nContraseña QA (todos los usuarios activos @${EMAIL_DOMAIN}): ${QA_PASSWORD}`,
  );
  console.log(
    '(el usuario qa.inactive@' +
      EMAIL_DOMAIN +
      ' tiene la misma contraseña pero isActive=false: debe fallar el login)',
  );
  console.log('===============================\n');
}

async function main() {
  console.log(`Sembrando ${QA_USERS.length} usuarios de QA...`);
  const users = await Promise.all(QA_USERS.map(upsertQaUser));
  const byKey = Object.fromEntries(
    QA_USERS.map((spec, i) => [spec.key, users[i]]),
  );

  console.log('Sembrando catálogo (productos/servicios)...');
  const products = await Promise.all(QA_PRODUCTS.map(findOrCreateProduct));
  const services = await Promise.all(QA_SERVICES.map(findOrCreateService));

  console.log('Otorgando permisos de QA...');
  const grantedPermissions = await grantQaPermissions(byKey['limited'].id);

  const alreadySeeded = await prisma.purchase.count({
    where: { clientId: byKey['cliente1'].id },
  });
  if (alreadySeeded > 0) {
    console.log(
      'Los documentos financieros de QA ya existen (el cliente qa.cliente1 ya tiene compras) ' +
        '-- se omite esa parte para no duplicar. Los usuarios y el catálogo sí se sincronizaron arriba.',
    );
  } else {
    console.log('Sembrando compras...');
    const purchaseCount = await seedPurchases(byKey, products);
    console.log(`  ${purchaseCount} compras creadas`);

    console.log('Sembrando facturas...');
    const { invoiceCount, chargeCount } = await seedInvoices(
      byKey,
      products,
      services,
    );
    console.log(
      `  ${invoiceCount} facturas creadas (${chargeCount} cargos en total)`,
    );

    console.log('Sembrando presupuestos...');
    const budgetCount = await seedBudgets(byKey, products);
    console.log(`  ${budgetCount} presupuestos creados`);

    console.log('Sembrando contratos de servicio...');
    const { contractCount, assignmentCount } = await seedServiceContracts(
      byKey,
      services,
    );
    console.log(
      `  ${contractCount} contratos creados (${assignmentCount} asignaciones de equipo)`,
    );
  }

  await printSummary(grantedPermissions);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
