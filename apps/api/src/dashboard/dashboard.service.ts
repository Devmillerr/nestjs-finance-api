import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

// Mismo criterio que apps/web/app/dashboard/page.tsx (UNPAID_STATUSES).
const UNPAID_STATUSES: PaymentStatus[] = ['PENDING', 'NOT_COMPLETED'];
const UPCOMING_WINDOW_DAYS = 30;
const RECENT_ACTIVITY_LIMIT = 6;
const UPCOMING_LIMIT = 6;
const DAY_MS = 86_400_000;

interface InvoiceLineLike {
  priceCents: number;
}
interface InvoiceChargeLike {
  type: string;
  amountCents: number;
}

// Invoice no guarda totalCents (a diferencia de Purchase) -- se recalcula a
// partir de lines/charges, igual que InvoicesService.computeTotals(). Se
// duplica acá en vez de exportar esa función porque son dominios distintos
// (lectura agregada vs. escritura transaccional) y ya es el patrón que sigue
// el resto del código (budgets/invoices ya duplican resolveLines() cada uno).
function invoiceTotalCents(
  lines: InvoiceLineLike[],
  charges: InvoiceChargeLike[],
): number {
  const subtotalCents = lines.reduce((sum, l) => sum + l.priceCents, 0);
  const chargesCents = charges.reduce((sum, c) => {
    const signed = c.type === 'DISCOUNT' ? -c.amountCents : c.amountCents;
    return sum + signed;
  }, 0);
  return subtotalCents + chargesCents;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // Mismo criterio de privilegio que ya usan findAll() de invoices/purchases:
  // ADMIN/OWNER ven el agregado global, cualquier otro usuario ve solo el suyo.
  async getStats(user: AuthenticatedUser, query: DashboardQueryDto) {
    const isPrivileged = user.role === 'ADMIN' || user.role === 'OWNER';
    const clientId = isPrivileged ? undefined : user.userId;
    const now = new Date();
    const periodStart = new Date(now.getTime() - query.periodDays * DAY_MS);
    const upcomingUntil = new Date(
      now.getTime() + UPCOMING_WINDOW_DAYS * DAY_MS,
    );

    const [
      overdueInvoices,
      concentrationInvoices,
      upcomingInvoices,
      recentPurchases,
      recentInvoices,
    ] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          deletedAt: null,
          clientId,
          paymentStatus: { in: UNPAID_STATUSES },
          expiration: { lt: now },
          createdAt: { gte: periodStart },
        },
        include: { lines: true, charges: true },
      }),
      this.prisma.invoice.findMany({
        where: { deletedAt: null, clientId, createdAt: { gte: periodStart } },
        include: { lines: true, charges: true },
      }),
      this.prisma.invoice.findMany({
        where: {
          deletedAt: null,
          clientId,
          paymentStatus: { in: UNPAID_STATUSES },
          expiration: { lte: upcomingUntil },
        },
        include: { lines: true, charges: true },
        orderBy: { expiration: 'asc' },
        take: UPCOMING_LIMIT,
      }),
      this.prisma.purchase.findMany({
        where: { deletedAt: null, clientId },
        orderBy: { createdAt: 'desc' },
        take: RECENT_ACTIVITY_LIMIT,
      }),
      this.prisma.invoice.findMany({
        where: { deletedAt: null, clientId },
        orderBy: { createdAt: 'desc' },
        take: RECENT_ACTIVITY_LIMIT,
        include: { lines: true, charges: true },
      }),
    ]);

    const overdueTotalCents = overdueInvoices.reduce(
      (sum, inv) => sum + invoiceTotalCents(inv.lines, inv.charges),
      0,
    );
    const maxDaysOverdue = overdueInvoices.reduce((max, inv) => {
      const days = Math.floor(
        (now.getTime() - inv.expiration.getTime()) / DAY_MS,
      );
      return Math.max(max, days);
    }, 0);

    const byClient = new Map<string, number>();
    for (const inv of concentrationInvoices) {
      const total = invoiceTotalCents(inv.lines, inv.charges);
      byClient.set(inv.clientId, (byClient.get(inv.clientId) ?? 0) + total);
    }
    const clientConcentrationRows = [...byClient.entries()]
      .map(([clientId, totalCents]) => ({ clientId, totalCents }))
      .sort((a, b) => b.totalCents - a.totalCents);
    const clientConcentrationTotalCents = clientConcentrationRows.reduce(
      (sum, row) => sum + row.totalCents,
      0,
    );

    const upcoming = upcomingInvoices.map((inv) => ({
      id: inv.id,
      expiration: inv.expiration,
      totalCents: invoiceTotalCents(inv.lines, inv.charges),
    }));

    const recentActivity = [
      ...recentPurchases.map((p) => ({
        kind: 'purchase' as const,
        id: p.id,
        createdAt: p.createdAt,
        totalCents: p.totalCents,
        paymentStatus: p.paymentStatus as string,
      })),
      ...recentInvoices.map((inv) => ({
        kind: 'invoice' as const,
        id: inv.id,
        createdAt: inv.createdAt,
        totalCents: invoiceTotalCents(inv.lines, inv.charges),
        paymentStatus: inv.paymentStatus as string,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, RECENT_ACTIVITY_LIMIT);

    return {
      period: query.period,
      overdueInvoices: {
        count: overdueInvoices.length,
        totalCents: overdueTotalCents,
        maxDaysOverdue,
      },
      clientConcentration: {
        rows: clientConcentrationRows,
        totalCents: clientConcentrationTotalCents,
        distinctClients: clientConcentrationRows.length,
        invoiceCount: concentrationInvoices.length,
      },
      upcomingInvoices: upcoming,
      recentActivity,
    };
  }
}
