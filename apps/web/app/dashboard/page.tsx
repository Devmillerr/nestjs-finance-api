'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { getErrorMessage } from '@/lib/api';
import { Topbar } from '@/components/layout/topbar';
import { EmptyState } from '@/components/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCents, formatDate } from '@/lib/format';
import { ArrowRight, Plus, Receipt, ShoppingCart } from 'lucide-react';

type Period = 'mes' | 'trimestre' | 'año';
const PERIOD_LABELS: Record<Period, string> = { mes: 'Mes', trimestre: 'Trimestre', año: 'Año' };

// Shape de GET /dashboard/stats (apps/api/src/dashboard/dashboard.service.ts).
// Cada bloque acá corresponde 1:1 a una sección real del backend -- nada de
// esto se inventa en el cliente, incluidos los períodos de comparación y las
// iniciales de cliente (UserDetails.firstName/lastName, con fallback al id).
interface DashboardStats {
  period: Period;
  receivable: {
    totalCents: number;
    overdueCents: number;
    upcomingCents: number;
    collectedCents: number;
    trendPct: number | null;
    sparkline: number[];
  };
  cashFlowForecast: {
    buckets: { label: string; dueCents: number; overdue: boolean }[];
    nextCutoff: { dateIso: string; totalCents: number } | null;
  };
  portfolioRisk: {
    concentrationPct: number;
    distinctClients: number;
    overdue30PlusPct: number;
    distribution: { label: string; pct: number }[];
    aging: { label: string; totalCents: number }[];
    worst: {
      clientLabel: string;
      pct: number;
      oldestInvoice: { totalCents: number; days: number } | null;
    } | null;
  };
  pipeline: {
    budgeted: { totalCents: number; count: number };
    invoiced: { totalCents: number; count: number };
    collected: { totalCents: number; count: number };
    overdue: { totalCents: number; count: number };
    conversionBudgetToCollectedPct: number | null;
    conversionCollectedToInvoicedPct: number | null;
  };
  recentActivity: {
    kind: 'purchase' | 'invoice';
    id: string;
    createdAt: string;
    totalCents: number;
    paymentStatus: string;
    clientLabel: string;
    expiration: string | null;
  }[];
}

// Separa "48,320.00" en ["48,320", "00"] para el número grande con los
// centavos en tamaño menor (mismo tratamiento tipográfico en todo "Cabina").
function splitAmount(cents: number): [string, string] {
  const formatted = (Math.abs(cents) / 100).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const dot = formatted.lastIndexOf('.');
  return dot === -1 ? [formatted, '00'] : [formatted.slice(0, dot), formatted.slice(dot + 1)];
}

function buildLinePath(values: number[], width: number, height: number, pad: number) {
  if (values.length === 0) return { path: '', points: [] as { x: number; y: number }[] };
  const max = Math.max(...values, 1);
  const innerH = height - pad * 2;
  const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  const points = values.map((v, i) => ({
    x: pad + step * i,
    y: pad + innerH - (v / max) * innerH,
  }));
  if (points.length === 1) {
    return { path: `M ${points[0].x} ${points[0].y}`, points };
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const mx = (p0.x + p1.x) / 2;
    const my = (p0.y + p1.y) / 2;
    d += ` Q ${p0.x} ${p0.y} ${mx} ${my}`;
  }
  d += ` T ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return { path: d, points };
}

function Donut({
  pct,
  colorClass,
  label,
  sub,
}: {
  pct: number;
  colorClass: string;
  label: string;
  sub: string;
}) {
  const r = 17;
  const circumference = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * circumference;
  return (
    <div className="text-center">
      <div className="relative aspect-square w-[clamp(68px,6vw,88px)]">
        <svg viewBox="0 0 42 42" className="size-full -rotate-90" aria-hidden>
          <circle cx="21" cy="21" r={r} fill="none" stroke="var(--border)" strokeWidth="3.2" />
          <circle
            cx="21"
            cy="21"
            r={r}
            fill="none"
            className={colorClass}
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[clamp(18px,1.6vw,23px)] font-semibold tracking-tight tabular-nums">{pct}%</span>
          <span className="text-[10.5px] text-muted-foreground">{label}</span>
        </div>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

const DISTRIBUTION_COLORS = ['bg-primary', 'bg-chart-2', 'bg-chart-rest'];
const AGING_DOT_COLORS = ['bg-muted-foreground/40', 'bg-warning', 'bg-warning', 'bg-destructive'];

// Insignia para el widget de actividad reciente: mapea (kind, paymentStatus)
// reales del backend a la misma paleta semántica que ya usa StatusBadge, sin
// inventar eventos que el backend no registra (p.ej. no hay un feed de
// "descuento aplicado" -- solo hay factura/compra + su estado real).
function activityPresentation(entry: DashboardStats['recentActivity'][number], now: number) {
  const isOverdue =
    entry.kind === 'invoice' &&
    entry.expiration !== null &&
    (entry.paymentStatus === 'PENDING' || entry.paymentStatus === 'NOT_COMPLETED') &&
    new Date(entry.expiration).getTime() < now;

  if (entry.paymentStatus === 'COMPLETED') {
    return {
      badge: 'Cobrado',
      badgeClass: 'bg-success-bg text-success',
      iconClass: 'bg-success-bg text-success',
      amountClass: 'text-success',
      amountPrefix: '+',
      sub: `Cobro recibido · ${formatDate(entry.createdAt)}`,
    };
  }
  if (isOverdue) {
    const days = Math.floor((now - new Date(entry.expiration as string).getTime()) / 86_400_000);
    return {
      badge: 'Vencido',
      badgeClass: 'bg-destructive/10 text-destructive',
      iconClass: 'bg-destructive/10 text-destructive',
      amountClass: 'text-foreground',
      amountPrefix: '',
      sub: `Venció hace ${days} día${days === 1 ? '' : 's'} · ${formatDate(entry.createdAt)}`,
    };
  }
  if (entry.paymentStatus === 'CANCELED') {
    return {
      badge: 'Cancelado',
      badgeClass: 'bg-destructive/10 text-destructive',
      iconClass: 'bg-muted text-muted-foreground',
      amountClass: 'text-foreground',
      amountPrefix: '',
      sub: `Cancelado · ${formatDate(entry.createdAt)}`,
    };
  }
  return {
    badge: 'Pendiente',
    badgeClass: 'bg-info-bg text-info',
    iconClass: 'bg-muted text-muted-foreground',
    amountClass: 'text-foreground',
    amountPrefix: '',
    sub: `Pendiente · ${formatDate(entry.createdAt)}`,
  };
}

export default function DashboardPage() {
  const { authFetch } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('mes');
  // Se fija junto con los datos de cada fetch (no en cada render): llamar
  // Date.now() directo en el cuerpo del componente es impuro.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- vuelve a "cargando" al cambiar de período; el setState real de los datos ocurre en la continuación async de abajo, no de forma síncrona en el cuerpo del efecto.
    setStats(null);
    (async () => {
      try {
        const data = await authFetch(`/dashboard/stats?period=${period}`);
        if (cancelled) return;
        setStats(data as DashboardStats);
        setNow(Date.now());
      } catch (err) {
        if (cancelled) return;
        setError(getErrorMessage(err, 'Error al cargar datos'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authFetch, period]);

  const loading = stats === null || now === null;

  const subtitle =
    now === null
      ? undefined
      : `${new Date(now).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })} · datos al ${new Date(
          now,
        ).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`;

  const sparkline = useMemo(
    () => (stats ? buildLinePath(stats.receivable.sparkline, 220, 70, 6) : { path: '', points: [] }),
    [stats],
  );
  const forecast = useMemo(() => {
    if (!stats) return { path: '', areaPath: '', points: [] as { x: number; y: number }[] };
    const values = stats.cashFlowForecast.buckets.map((b) => b.dueCents);
    const { path, points } = buildLinePath(values, 400, 130, 12);
    const areaPath =
      points.length > 0
        ? `${path} L ${points[points.length - 1].x} 118 L ${points[0].x} 118 Z`
        : '';
    return { path, areaPath, points };
  }, [stats]);

  return (
    <>
      <Topbar
        subtitle={subtitle}
        actions={
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center rounded-md border border-border bg-background p-0.5 text-[12.5px]">
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={
                    p === period
                      ? 'rounded-[5px] bg-secondary px-3 py-1 font-medium text-foreground'
                      : 'px-3 py-1 text-muted-foreground transition-colors duration-150 hover:text-foreground'
                  }
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
            <Link
              href="/dashboard/invoices/new"
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus size={14} strokeWidth={2} />
              Nueva factura
            </Link>
          </div>
        }
      />

      <div className="pt-3 pb-6">
        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-[4fr_5fr]">
          {/* Por cobrar */}
          <section className="rounded-2xl border border-border bg-card p-5">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <>
                <div className="flex items-start gap-3.5">
                  <div>
                    <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                      Por cobrar
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">USD</p>
                  </div>
                  {stats.receivable.trendPct !== null && (
                    <div className="ml-auto text-right">
                      <span
                        className={
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ' +
                          (stats.receivable.trendPct >= 0
                            ? 'bg-success-bg text-success'
                            : 'bg-destructive/10 text-destructive')
                        }
                      >
                        {stats.receivable.trendPct >= 0 ? '↑' : '↓'} {Math.abs(stats.receivable.trendPct)}%
                      </span>
                      <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                        vs. {PERIOD_LABELS[period].toLowerCase()} anterior
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-4">
                  <p className="font-mono text-[clamp(32px,3.3vw,46px)] font-semibold tracking-tight tabular-nums">
                    {splitAmount(stats.receivable.totalCents)[0]}
                    <span className="text-[0.46em] font-medium text-muted-foreground">
                      .{splitAmount(stats.receivable.totalCents)[1]}
                    </span>
                  </p>
                  {sparkline.points.length > 1 && (
                    <svg viewBox="0 0 220 70" preserveAspectRatio="none" className="h-[46px] flex-1 text-primary" aria-hidden>
                      <path d={sparkline.path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                      <circle
                        cx={sparkline.points[sparkline.points.length - 1].x}
                        cy={sparkline.points[sparkline.points.length - 1].y}
                        r="3.4"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2.5">
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-destructive" />
                    <div>
                      <p className="font-mono text-[19px] font-semibold tracking-tight tabular-nums text-destructive">
                        {(stats.receivable.overdueCents / 100).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">Vencido</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="font-mono text-[19px] font-semibold tracking-tight tabular-nums">
                        {(stats.receivable.upcomingCents / 100).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">Por vencer</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-success" />
                    <div>
                      <p className="font-mono text-[19px] font-semibold tracking-tight tabular-nums text-success">
                        {(stats.receivable.collectedCents / 100).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">Cobrado</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* Flujo esperado */}
          <section className="rounded-2xl border border-border bg-card p-5">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : stats.cashFlowForecast.buckets.length === 0 ? (
              <>
                <h2 className="text-[15px] font-semibold">Flujo esperado</h2>
                <p className="mt-1 text-xs text-muted-foreground">¿cuándo entra lo que me deben?</p>
                <div className="mt-4">
                  <EmptyState title="Nada por cobrar" description="No hay facturas vencidas ni por vencer en los próximos 30 días." />
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
                  <div>
                    <h2 className="text-[15px] font-semibold">Flujo esperado</h2>
                    <p className="mt-1 text-xs text-muted-foreground">¿cuándo entra lo que me deben?</p>
                  </div>
                  {stats.cashFlowForecast.nextCutoff && (
                    <p className="ml-auto text-[12.5px] text-muted-foreground">
                      {formatCents(stats.cashFlowForecast.nextCutoff.totalCents)} antes del{' '}
                      {formatDate(stats.cashFlowForecast.nextCutoff.dateIso)}
                    </p>
                  )}
                </div>

                <div className="relative mt-2.5 h-[130px]">
                  <svg viewBox="0 0 400 130" preserveAspectRatio="none" className="block size-full text-primary" aria-hidden>
                    <defs>
                      <linearGradient id="flowFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={forecast.areaPath} fill="url(#flowFill)" stroke="none" />
                    {forecast.points.map((p, i) => (
                      <line
                        key={i}
                        x1={p.x}
                        y1={p.y}
                        x2={p.x}
                        y2={118}
                        stroke="var(--border)"
                        strokeWidth="1"
                        strokeDasharray="3 4"
                        vectorEffect="non-scaling-stroke"
                      />
                    ))}
                    <path d={forecast.path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                    {forecast.points.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        className={stats.cashFlowForecast.buckets[i]?.overdue ? 'text-destructive' : ''}
                        fill={stats.cashFlowForecast.buckets[i]?.overdue ? 'currentColor' : 'currentColor'}
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex pointer-events-none">
                    {stats.cashFlowForecast.buckets.map((b, i) => (
                      <div key={i} className="flex flex-1 items-start justify-center pt-1">
                        <span
                          className={
                            'font-mono text-xs ' + (b.overdue ? 'text-destructive' : 'text-muted-foreground')
                          }
                        >
                          {(b.dueCents / 100).toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-2 flex">
                  {stats.cashFlowForecast.buckets.map((b, i) => (
                    <p
                      key={i}
                      className={
                        'flex-1 text-center font-mono text-[11px] tracking-[0.14em] uppercase ' +
                        (b.overdue ? 'text-destructive' : i === 0 ? 'text-foreground' : 'text-muted-foreground')
                      }
                    >
                      {b.label}
                    </p>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_1.1fr]">
          {/* Riesgo de cartera */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-[15px] font-semibold">Riesgo de cartera</h2>
            <p className="mt-1 text-xs text-muted-foreground">concentración, antigüedad y exposición</p>

            {loading ? (
              <Skeleton className="mt-4 h-40 w-full" />
            ) : stats.portfolioRisk.distribution.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="Necesitás más de un cliente"
                  description="Esta vista compara riesgo y concentración entre clientes. Con uno solo en el período no hay nada que comparar."
                />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-center gap-4 py-3">
                  <Donut
                    pct={stats.portfolioRisk.concentrationPct}
                    colorClass="text-primary"
                    label="concentración"
                    sub={`en ${stats.portfolioRisk.distinctClients} cliente${stats.portfolioRisk.distinctClients === 1 ? '' : 's'}`}
                  />
                  <Donut
                    pct={stats.portfolioRisk.overdue30PlusPct}
                    colorClass="text-destructive"
                    label="vencido +30 d"
                    sub={
                      stats.portfolioRisk.overdue30PlusPct >= 50
                        ? 'alto riesgo'
                        : stats.portfolioRisk.overdue30PlusPct >= 20
                          ? 'riesgo moderado'
                          : 'bajo riesgo'
                    }
                  />
                </div>

                <div className="mt-2">
                  <p className="mb-2 text-[11.5px] text-muted-foreground">Distribución de clientes</p>
                  <div className="flex gap-1.5">
                    {stats.portfolioRisk.distribution.map((d, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-sm ${DISTRIBUTION_COLORS[i] ?? 'bg-chart-rest'}`}
                        style={{ flex: Math.max(d.pct, 2) }}
                      />
                    ))}
                  </div>
                  <div className="mt-1.5 flex gap-1.5">
                    {stats.portfolioRisk.distribution.map((d, i) => (
                      <div key={i} style={{ flex: Math.max(d.pct, 2) }} className={i === stats.portfolioRisk.distribution.length - 1 ? 'text-right' : ''}>
                        <p className="text-[11.5px]">{d.label}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{d.pct}%</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3.5">
                  <p className="mb-2.5 text-[11.5px] text-muted-foreground">Antigüedad del vencido</p>
                  <div className="relative h-2.5">
                    <div
                      className="absolute inset-x-1 top-[5px] h-0.5 rounded-full"
                      style={{
                        background:
                          'linear-gradient(90deg, color-mix(in srgb, var(--muted-foreground) 40%, transparent), var(--warning), var(--destructive))',
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between">
                      {AGING_DOT_COLORS.map((c, i) => (
                        <span key={i} className={`size-2.5 rounded-full ${c}`} />
                      ))}
                    </div>
                  </div>
                  <div className="mt-2.5 flex justify-between">
                    {stats.portfolioRisk.aging.map((a, i) => (
                      <span
                        key={i}
                        className={
                          'font-mono text-[11px] ' +
                          (i >= 2 ? (i === 3 ? 'text-destructive' : 'text-foreground') : 'text-muted-foreground')
                        }
                      >
                        {a.label}
                      </span>
                    ))}
                  </div>
                  {stats.portfolioRisk.worst && (
                    <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
                      {stats.portfolioRisk.worst.clientLabel} concentra el {stats.portfolioRisk.worst.pct}% del ingreso
                      {stats.portfolioRisk.worst.oldestInvoice
                        ? ` y tiene la factura más vieja: ${formatCents(stats.portfolioRisk.worst.oldestInvoice.totalCents)} con ${stats.portfolioRisk.worst.oldestInvoice.days} días.`
                        : '.'}
                    </p>
                  )}
                </div>
              </>
            )}
          </section>

          {/* Pipeline del trimestre */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-[15px] font-semibold">Pipeline del período</h2>
            <p className="mt-1 text-xs text-muted-foreground">del presupuesto al cobro</p>

            {loading ? (
              <Skeleton className="mt-4 h-40 w-full" />
            ) : stats.pipeline.budgeted.count === 0 && stats.pipeline.invoiced.count === 0 ? (
              <div className="mt-4">
                <EmptyState title="Sin movimientos" description="No hay presupuestos ni facturas en este período." />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 py-2.5">
                  <svg viewBox="0 0 100 180" preserveAspectRatio="xMidYMid meet" className="h-auto max-h-40 w-[clamp(50px,4.6vw,80px)] shrink-0 self-stretch" aria-hidden>
                    <path d="M4 4 H96 L80 40 H20 Z" className="fill-chart-3" />
                    <path d="M20 48 H80 L67 84 H33 Z" className="fill-chart-2" />
                    <path d="M33 92 H67 L56 128 H44 Z" className="fill-success" />
                    <path d="M40 136 H60 L50 172 Z" className="fill-destructive" />
                  </svg>

                  <div className="min-w-0 flex-1 space-y-2.5">
                    {[
                      { label: 'Presupuestado', dot: 'bg-chart-3', ...stats.pipeline.budgeted, valueClass: '' },
                      { label: 'Facturado', dot: 'bg-chart-2', ...stats.pipeline.invoiced, valueClass: '' },
                      { label: 'Cobrado', dot: 'bg-success', ...stats.pipeline.collected, valueClass: 'text-success' },
                      { label: 'Vencido', dot: 'bg-destructive', ...stats.pipeline.overdue, valueClass: 'text-destructive' },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center gap-2.5">
                        <span className={`size-2 shrink-0 rounded-full ${row.dot}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] text-muted-foreground">{row.label}</p>
                          <div className="mt-1.5 h-0.5 rounded-full bg-border" />
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`text-sm font-semibold tabular-nums ${row.valueClass}`}>
                            {(row.totalCents / 100).toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{row.count} docs</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2.5 rounded-xl bg-inset px-4 py-3">
                  <div className="min-w-0 flex-1 basis-28">
                    <p className="text-[11px] text-muted-foreground">
                      Conversión <span className="text-foreground/80">presupuesto → cobro</span>
                    </p>
                    <p className="mt-1.5 mb-1.5 text-lg font-semibold tracking-tight tabular-nums">
                      {stats.pipeline.conversionBudgetToCollectedPct ?? '—'}
                      {stats.pipeline.conversionBudgetToCollectedPct !== null && '%'}
                    </p>
                    <div className="h-[3px] rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-foreground"
                        style={{ width: `${stats.pipeline.conversionBudgetToCollectedPct ?? 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 basis-28">
                    <p className="text-[11px] text-muted-foreground">Cobro / facturado</p>
                    <p className="mt-1.5 mb-1.5 text-lg font-semibold tracking-tight tabular-nums">
                      {stats.pipeline.conversionCollectedToInvoicedPct ?? '—'}
                      {stats.pipeline.conversionCollectedToInvoicedPct !== null && '%'}
                    </p>
                    <div className="h-[3px] rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-success"
                        style={{ width: `${stats.pipeline.conversionCollectedToInvoicedPct ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* Actividad reciente */}
          <section className="rounded-2xl border border-border bg-card py-4">
            <div className="flex items-baseline gap-3 px-5">
              <div>
                <h2 className="text-[15px] font-semibold">Actividad reciente</h2>
                <p className="mt-1 text-xs text-muted-foreground">últimos movimientos en el sistema</p>
              </div>
              <Link
                href="/dashboard/invoices"
                className="ml-auto flex items-center gap-1 text-xs whitespace-nowrap text-primary hover:underline"
              >
                Ver todo <ArrowRight size={12} />
              </Link>
            </div>

            <div className="mt-2 flex flex-col gap-0.5 px-2.5">
              {loading ? (
                <div className="space-y-3 p-3">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ) : stats.recentActivity.length === 0 ? (
                <div className="px-2.5">
                  <EmptyState title="Sin actividad todavía" description="Cuando registres una compra o factura, va a aparecer acá." />
                </div>
              ) : (
                stats.recentActivity.map((entry) => {
                  // `now` ya está garantizado (no-null) acá: esta rama solo se
                  // alcanza cuando !loading, que exige stats!==null && now!==null.
                  const presentation = activityPresentation(entry, now as number);
                  return (
                    <Link
                      key={`${entry.kind}-${entry.id}`}
                      href={`/dashboard/${entry.kind === 'purchase' ? 'purchases' : 'invoices'}/${entry.id}`}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors hover:bg-muted/60"
                    >
                      <span className={`flex size-[30px] shrink-0 items-center justify-center rounded-full ${presentation.iconClass}`}>
                        {entry.kind === 'purchase' ? (
                          <ShoppingCart size={15} strokeWidth={1.8} />
                        ) : (
                          <Receipt size={15} strokeWidth={1.8} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-medium">
                          {entry.kind === 'purchase' ? 'Compra' : 'Factura'} #{entry.id.slice(0, 6)} · {entry.clientLabel}
                        </p>
                        <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{presentation.sub}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${presentation.badgeClass}`}>
                        {presentation.badge}
                      </span>
                      <span className={`w-[88px] shrink-0 text-right text-[13px] font-semibold tabular-nums ${presentation.amountClass}`}>
                        {presentation.amountPrefix}
                        {formatCents(entry.totalCents)}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
