import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

function createPrismaMock() {
  const invoice = { findMany: jest.fn().mockResolvedValue([]) };
  const purchase = { findMany: jest.fn().mockResolvedValue([]) };
  return {
    prisma: { invoice, purchase } as unknown as PrismaService,
    invoice,
    purchase,
  };
}

function invoiceRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'inv-1',
    clientId: 'client-1',
    createdAt: new Date('2026-08-01T00:00:00Z'),
    expiration: new Date('2026-08-15T00:00:00Z'),
    paymentStatus: 'PENDING',
    lines: [{ priceCents: 10_000 }],
    charges: [],
    ...overrides,
  };
}

const USER: AuthenticatedUser = {
  userId: 'user-1',
  email: 'x@y.com',
  role: 'USER',
  permissions: [],
};
const OWNER: AuthenticatedUser = { ...USER, role: 'OWNER' };
const QUERY = Object.assign(new DashboardQueryDto(), { period: 'mes' });

describe('DashboardService.getStats', () => {
  it('un USER no privilegiado consulta solo sus propios registros (clientId=userId)', async () => {
    const { prisma, invoice, purchase } = createPrismaMock();

    await new DashboardService(prisma).getStats(USER, QUERY);

    for (const call of invoice.findMany.mock.calls) {
      expect(call[0].where.clientId).toBe('user-1');
    }
    for (const call of purchase.findMany.mock.calls) {
      expect(call[0].where.clientId).toBe('user-1');
    }
  });

  it('ADMIN/OWNER consultan el agregado global (clientId=undefined)', async () => {
    const { prisma, invoice } = createPrismaMock();

    await new DashboardService(prisma).getStats(OWNER, QUERY);

    for (const call of invoice.findMany.mock.calls) {
      expect(call[0].where.clientId).toBeUndefined();
    }
  });

  it('calcula count/totalCents/maxDaysOverdue de facturas vencidas a partir de lines+charges', async () => {
    const { prisma, invoice } = createPrismaMock();
    const now = new Date('2026-09-06T00:00:00Z');
    jest.useFakeTimers().setSystemTime(now);

    // Primera llamada a invoice.findMany = overdueInvoices (ver orden en el service).
    invoice.findMany
      .mockResolvedValueOnce([
        invoiceRow({
          expiration: new Date('2026-08-27T00:00:00Z'), // 10 días vencida
          lines: [{ priceCents: 15_000 }],
          charges: [{ type: 'TAX', amountCents: 1_000 }],
        }),
      ])
      .mockResolvedValueOnce([]) // concentrationInvoices
      .mockResolvedValueOnce([]); // upcomingInvoices

    const result = await new DashboardService(prisma).getStats(USER, QUERY);

    expect(result.overdueInvoices).toEqual({
      count: 1,
      totalCents: 16_000,
      maxDaysOverdue: 10,
    });
    jest.useRealTimers();
  });

  it('agrupa la concentración por clientId y ordena de mayor a menor', async () => {
    const { prisma, invoice } = createPrismaMock();

    invoice.findMany
      .mockResolvedValueOnce([]) // overdueInvoices
      .mockResolvedValueOnce([
        invoiceRow({ clientId: 'a', lines: [{ priceCents: 5_000 }] }),
        invoiceRow({ clientId: 'b', lines: [{ priceCents: 20_000 }] }),
        invoiceRow({ clientId: 'a', lines: [{ priceCents: 5_000 }] }),
      ])
      .mockResolvedValueOnce([]); // upcomingInvoices

    const result = await new DashboardService(prisma).getStats(USER, QUERY);

    expect(result.clientConcentration).toEqual({
      rows: [
        { clientId: 'b', totalCents: 20_000 },
        { clientId: 'a', totalCents: 10_000 },
      ],
      totalCents: 30_000,
      distinctClients: 2,
      invoiceCount: 3,
    });
  });

  it('mezcla purchases + invoices recientes por createdAt desc y corta a 6', async () => {
    const { prisma, invoice, purchase } = createPrismaMock();

    purchase.findMany.mockResolvedValue([
      {
        id: 'p1',
        createdAt: new Date('2026-09-05T00:00:00Z'),
        totalCents: 1000,
        paymentStatus: 'COMPLETED',
      },
    ]);
    invoice.findMany
      .mockResolvedValueOnce([]) // overdueInvoices
      .mockResolvedValueOnce([]) // concentrationInvoices
      .mockResolvedValueOnce([]) // upcomingInvoices
      // recentInvoices es la 4ta llamada a invoice.findMany en el service.
      .mockResolvedValueOnce([
        invoiceRow({ id: 'i1', createdAt: new Date('2026-09-06T00:00:00Z') }),
      ]);

    const result = await new DashboardService(prisma).getStats(USER, QUERY);

    expect(result.recentActivity[0]).toMatchObject({
      kind: 'invoice',
      id: 'i1',
    });
    expect(result.recentActivity[1]).toMatchObject({
      kind: 'purchase',
      id: 'p1',
    });
    expect(result.recentActivity.length).toBeLessThanOrEqual(6);
  });
});
