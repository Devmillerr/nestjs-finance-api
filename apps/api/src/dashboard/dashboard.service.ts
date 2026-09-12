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
const MONTH_LABELS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

interface InvoiceLineLike {
  priceCents: number;
}
interface InvoiceChargeLike {
  type: string;
  amountCents: number;
}
interface ClientDetailsLike {
  client: { details: { firstName: string; lastName: string } | null };
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

// Iniciales reales del cliente (UserDetails.firstName/lastName) para las
// etiquetas cortas de "Riesgo de cartera" y "Actividad reciente" -- si el
// cliente no cargó su perfil todavía, cae a las primeras 2 letras del id
// (mismo fallback que ya usaba la lista de concentración con "Cliente #id").
function clientInitials(
  row: ClientDetailsLike | undefined,
  clientId: string,
): string {
  const details = row?.client?.details;
  if (details) {
    return `${details.firstName[0]}${details.lastName[0]}`.toUpperCase();
  }
  return clientId.slice(0, 2).toUpperCase();
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
    const previousPeriodStart = new Date(
      periodStart.getTime() - query.periodDays * DAY_MS,
    );
    const upcomingUntil = new Date(
      now.getTime() + UPCOMING_WINDOW_DAYS * DAY_MS,
    );
    const clientInclude = { client: { include: { details: true } } };

    const [
      overdueInvoices,
      periodInvoices,
      upcomingInvoices,
      previousPeriodInvoices,
      periodBudgets,
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
        include: { lines: true, charges: true, ...clientInclude },
      }),
      // Reemplaza a la antigua "concentrationInvoices": el mismo conjunto
      // (todas las facturas del período) ahora también alimenta el pipeline
      // (facturado/cobrado) además de la concentración por cliente.
      this.prisma.invoice.findMany({
        where: { deletedAt: null, clientId, createdAt: { gte: periodStart } },
        include: { lines: true, charges: true, ...clientInclude },
      }),
      this.prisma.invoice.findMany({
        where: {
          deletedAt: null,
          clientId,
          paymentStatus: { in: UNPAID_STATUSES },
          expiration: { lte: upcomingUntil, gte: now },
        },
        include: { lines: true, charges: true },
        orderBy: { expiration: 'asc' },
        take: UPCOMING_LIMIT,
      }),
      // Solo para la tendencia ("vs. período anterior"): mismo criterio de
      // ventana que periodInvoices pero desplazado un período hacia atrás.
      this.prisma.invoice.findMany({
        where: {
          deletedAt: null,
          clientId,
          createdAt: { gte: previousPeriodStart, lt: periodStart },
        },
        include: { lines: true, charges: true },
      }),
      this.prisma.budget.findMany({
        where: { deletedAt: null, clientId, createdAt: { gte: periodStart } },
        include: { lines: true },
      }),
      this.prisma.purchase.findMany({
        where: { deletedAt: null, clientId },
        orderBy: { createdAt: 'desc' },
        take: RECENT_ACTIVITY_LIMIT,
        include: clientInclude,
      }),
      this.prisma.invoice.findMany({
        where: { deletedAt: null, clientId },
        orderBy: { createdAt: 'desc' },
        take: RECENT_ACTIVITY_LIMIT,
        include: { lines: true, charges: true, ...clientInclude },
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

    // ── Concentración por cliente (base también del pipeline y del riesgo) ──
    const byClient = new Map<string, number>();
    for (const inv of periodInvoices) {
      const total = invoiceTotalCents(inv.lines, inv.charges);
      byClient.set(inv.clientId, (byClient.get(inv.clientId) ?? 0) + total);
    }
    const clientConcentrationRows = [...byClient.entries()]
      .map(([id, totalCents]) => ({ clientId: id, totalCents }))
      .sort((a, b) => b.totalCents - a.totalCents);
    const clientConcentrationTotalCents = clientConcentrationRows.reduce(
      (sum, row) => sum + row.totalCents,
      0,
    );

    // ── Por cobrar: vencido + por vencer (lo ya cobrado se muestra aparte) ──
    const upcomingTotalCents = upcomingInvoices.reduce(
      (sum, inv) => sum + invoiceTotalCents(inv.lines, inv.charges),
      0,
    );
    const collectedInvoices = periodInvoices.filter(
      (inv) => inv.paymentStatus === 'COMPLETED',
    );
    const collectedTotalCents = collectedInvoices.reduce(
      (sum, inv) => sum + invoiceTotalCents(inv.lines, inv.charges),
      0,
    );
    const periodInvoicedTotalCents = periodInvoices.reduce(
      (sum, inv) => sum + invoiceTotalCents(inv.lines, inv.charges),
      0,
    );
    const previousPeriodTotalCents = previousPeriodInvoices.reduce(
      (sum, inv) => sum + invoiceTotalCents(inv.lines, inv.charges),
      0,
    );
    // Tendencia de actividad (volumen facturado) vs. el período anterior de
    // igual longitud -- no hay snapshots históricos de saldo, así que se
    // compara lo facturado, no el saldo pendiente en sí.
    const receivableTrendPct =
      previousPeriodTotalCents > 0
        ? Math.round(
            ((periodInvoicedTotalCents - previousPeriodTotalCents) /
              previousPeriodTotalCents) *
              100,
          )
        : null;
    // Sparkline: actividad facturada del período repartida en hasta 6 tramos
    // iguales -- no es el saldo día a día (no se guarda), es el volumen
    // facturado a lo largo del período, igual de real, solo otra métrica.
    const sparkline = bucketByTime(
      periodInvoices.map((inv) => ({
        at: inv.createdAt,
        cents: invoiceTotalCents(inv.lines, inv.charges),
      })),
      periodStart,
      now,
      6,
    ).map((b) => b.cents);

    // ── Flujo esperado: vencido + próximos vencimientos agrupados por mes ──
    const upcomingByMonth = new Map<
      string,
      { label: string; dueCents: number; maxDate: Date }
    >();
    for (const inv of upcomingInvoices) {
      const key = `${inv.expiration.getUTCFullYear()}-${inv.expiration.getUTCMonth()}`;
      const cents = invoiceTotalCents(inv.lines, inv.charges);
      const existing = upcomingByMonth.get(key);
      if (existing) {
        existing.dueCents += cents;
        if (inv.expiration > existing.maxDate)
          existing.maxDate = inv.expiration;
      } else {
        upcomingByMonth.set(key, {
          label: MONTH_LABELS[inv.expiration.getUTCMonth()],
          dueCents: cents,
          maxDate: inv.expiration,
        });
      }
    }
    const upcomingBuckets = [...upcomingByMonth.values()].sort(
      (a, b) => a.maxDate.getTime() - b.maxDate.getTime(),
    );
    const cashFlowBuckets = [
      ...(overdueTotalCents > 0
        ? [{ label: 'Vencido', dueCents: overdueTotalCents, overdue: true }]
        : []),
      ...upcomingBuckets.map((b) => ({
        label: b.label,
        dueCents: b.dueCents,
        overdue: false,
      })),
    ];
    const firstUpcomingBucket = upcomingBuckets[0];
    const nextCutoff = firstUpcomingBucket
      ? {
          dateIso: firstUpcomingBucket.maxDate.toISOString(),
          totalCents: overdueTotalCents + firstUpcomingBucket.dueCents,
        }
      : null;

    // ── Riesgo de cartera: concentración, envejecimiento y peor cliente ──
    const topRow = clientConcentrationRows[0];
    const secondRow = clientConcentrationRows[1];
    const concentrationPct =
      clientConcentrationTotalCents > 0 && topRow
        ? Math.round((topRow.totalCents / clientConcentrationTotalCents) * 100)
        : 0;
    const distribution = topRow
      ? (() => {
          const topPct = Math.round(
            (topRow.totalCents / clientConcentrationTotalCents) * 100,
          );
          const secondPct = secondRow
            ? Math.round(
                (secondRow.totalCents / clientConcentrationTotalCents) * 100,
              )
            : 0;
          const rows = [
            {
              label: clientInitials(
                periodInvoices.find((i) => i.clientId === topRow.clientId),
                topRow.clientId,
              ),
              pct: topPct,
            },
          ];
          if (secondRow) {
            rows.push({
              label: clientInitials(
                periodInvoices.find((i) => i.clientId === secondRow.clientId),
                secondRow.clientId,
              ),
              pct: secondPct,
            });
          }
          rows.push({
            label: 'Resto',
            pct: Math.max(0, 100 - topPct - secondPct),
          });
          return rows;
        })()
      : [];

    const AGING_BUCKETS = ['1-7 d', '8-30', '31-60', '+60'] as const;
    const aging = AGING_BUCKETS.map((label) => ({ label, totalCents: 0 }));
    for (const inv of overdueInvoices) {
      const days = Math.floor(
        (now.getTime() - inv.expiration.getTime()) / DAY_MS,
      );
      const idx = days <= 7 ? 0 : days <= 30 ? 1 : days <= 60 ? 2 : 3;
      aging[idx].totalCents += invoiceTotalCents(inv.lines, inv.charges);
    }
    const overdue30PlusCents = aging[2].totalCents + aging[3].totalCents;
    const overdue30PlusPct =
      overdueTotalCents > 0
        ? Math.round((overdue30PlusCents / overdueTotalCents) * 100)
        : 0;

    const worstClientOverdue = topRow
      ? overdueInvoices
          .filter((inv) => inv.clientId === topRow.clientId)
          .sort((a, b) => a.expiration.getTime() - b.expiration.getTime())[0]
      : undefined;
    const worst = topRow
      ? {
          clientLabel: clientInitials(
            periodInvoices.find((i) => i.clientId === topRow.clientId),
            topRow.clientId,
          ),
          pct: concentrationPct,
          oldestInvoice: worstClientOverdue
            ? {
                totalCents: invoiceTotalCents(
                  worstClientOverdue.lines,
                  worstClientOverdue.charges,
                ),
                days: Math.floor(
                  (now.getTime() - worstClientOverdue.expiration.getTime()) /
                    DAY_MS,
                ),
              }
            : null,
        }
      : null;

    // ── Pipeline del trimestre: presupuestado -> facturado -> cobrado / vencido ──
    const budgetedTotalCents = periodBudgets.reduce(
      (sum, b) => sum + b.lines.reduce((s, l) => s + (l.priceCents ?? 0), 0),
      0,
    );
    const pipeline = {
      budgeted: { totalCents: budgetedTotalCents, count: periodBudgets.length },
      invoiced: {
        totalCents: periodInvoicedTotalCents,
        count: periodInvoices.length,
      },
      collected: {
        totalCents: collectedTotalCents,
        count: collectedInvoices.length,
      },
      overdue: { totalCents: overdueTotalCents, count: overdueInvoices.length },
      conversionBudgetToCollectedPct:
        budgetedTotalCents > 0
          ? Math.round((collectedTotalCents / budgetedTotalCents) * 100)
          : null,
      conversionCollectedToInvoicedPct:
        periodInvoicedTotalCents > 0
          ? Math.round((collectedTotalCents / periodInvoicedTotalCents) * 100)
          : null,
    };

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
        clientLabel: clientInitials(p, p.clientId),
        expiration: null as Date | null,
      })),
      ...recentInvoices.map((inv) => ({
        kind: 'invoice' as const,
        id: inv.id,
        createdAt: inv.createdAt,
        totalCents: invoiceTotalCents(inv.lines, inv.charges),
        paymentStatus: inv.paymentStatus as string,
        expiration: inv.expiration as Date | null,
        clientLabel: clientInitials(inv, inv.clientId),
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
        invoiceCount: periodInvoices.length,
      },
      receivable: {
        totalCents: overdueTotalCents + upcomingTotalCents,
        overdueCents: overdueTotalCents,
        upcomingCents: upcomingTotalCents,
        collectedCents: collectedTotalCents,
        trendPct: receivableTrendPct,
        sparkline,
      },
      cashFlowForecast: {
        buckets: cashFlowBuckets,
        nextCutoff,
      },
      portfolioRisk: {
        concentrationPct,
        distinctClients: clientConcentrationRows.length,
        overdue30PlusPct,
        distribution,
        aging,
        worst,
      },
      pipeline,
      upcomingInvoices: upcoming,
      recentActivity,
    };
  }
}

// Reparte una lista de eventos con fecha+monto en N tramos iguales dentro de
// [from, to) y suma los montos de cada tramo -- usado para el sparkline de
// "Por cobrar" (no hay saldo histórico guardado, así que se agrega actividad
// real del período en vez de inventar una serie).
function bucketByTime(
  events: { at: Date; cents: number }[],
  from: Date,
  to: Date,
  bucketCount: number,
): { cents: number }[] {
  const buckets = Array.from({ length: bucketCount }, () => ({ cents: 0 }));
  const spanMs = Math.max(1, to.getTime() - from.getTime());
  for (const ev of events) {
    const ratio = (ev.at.getTime() - from.getTime()) / spanMs;
    const idx = Math.min(
      bucketCount - 1,
      Math.max(0, Math.floor(ratio * bucketCount)),
    );
    buckets[idx].cents += ev.cents;
  }
  return buckets;
}
