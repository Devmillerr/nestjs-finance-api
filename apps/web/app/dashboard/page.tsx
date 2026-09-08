'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { getErrorMessage } from '@/lib/api';
import { Topbar } from '@/components/layout/topbar';
import { EmptyState } from '@/components/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCents, formatDate } from '@/lib/format';
import { Plus, Receipt, ShoppingCart } from 'lucide-react';

type Period = 'mes' | 'trimestre' | 'año';
const PERIOD_LABELS: Record<Period, string> = { mes: 'Mes', trimestre: 'Trimestre', año: 'Año' };
// Rampa de series del design system (--chart-1..5, --chart-rest en globals.css):
// pasos del accent en orden de ranking, no colores arbitrarios por cliente.
const CLIENT_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];
const CLIENT_COLOR_REST = 'var(--chart-rest)';

// Shape de GET /dashboard/stats (apps/api/src/dashboard/dashboard.service.ts).
// Los agregados (vencidas, concentración, próximos vencimientos, actividad)
// se calculan en el backend sobre el conjunto real filtrado -- no sobre una
// ventana capada de los últimos N registros, que es lo que hacía esta
// pantalla antes y que quedaba mal apenas hubiera más de 50 facturas/compras.
interface DashboardStats {
  period: Period;
  overdueInvoices: { count: number; totalCents: number; maxDaysOverdue: number };
  clientConcentration: {
    rows: { clientId: string; totalCents: number }[];
    totalCents: number;
    distinctClients: number;
    invoiceCount: number;
  };
  upcomingInvoices: { id: string; expiration: string; totalCents: number }[];
  recentActivity: {
    kind: 'purchase' | 'invoice';
    id: string;
    createdAt: string;
    totalCents: number;
    paymentStatus: string;
  }[];
}

// Insignia para widgets del mockup que todavía no tienen lógica de backend
// real (salud financiera, proyección de caja, caja disponible): se muestra
// la misma forma/copy del diseño, pero deshabilitada -- el mismo criterio
// que ya usa el sidebar para Transacciones/Reportes/Configuración, en vez de
// reemplazar el widget por otra métrica distinta a la del mockup.
function ProntoBadge() {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">
      Pronto
    </span>
  );
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

  const loading = stats === null;

  const requiereAtencion = useMemo(() => {
    if (!stats) return [];
    const items: { label: string; sub: string; cents: number }[] = [];
    const { overdueInvoices, clientConcentration } = stats;
    if (overdueInvoices.count > 0) {
      items.push({
        label: `${overdueInvoices.count} factura${overdueInvoices.count === 1 ? '' : 's'} vencida${overdueInvoices.count === 1 ? '' : 's'}`,
        sub: `máx. ${overdueInvoices.maxDaysOverdue} día${overdueInvoices.maxDaysOverdue === 1 ? '' : 's'} de atraso`,
        cents: overdueInvoices.totalCents,
      });
    }
    if (clientConcentration.distinctClients >= 2 && clientConcentration.totalCents > 0) {
      const top = clientConcentration.rows[0];
      const pct = Math.round((top.totalCents / clientConcentration.totalCents) * 100);
      if (pct >= 50) {
        items.push({
          label: 'Concentración alta',
          sub: `el cliente principal es el ${pct}% del período`,
          cents: top.totalCents,
        });
      }
    }
    return items;
  }, [stats]);

  const subtitle =
    now === null
      ? undefined
      : `${new Date(now).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })} · datos al ${new Date(
          now,
        ).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`;

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

      <div className="pt-3">
        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        {/* Salud financiera + Caja proyectada: mismas dos cards del mockup,
            marcadas "Pronto" -- calcular un score de salud o una proyección
            de caja con banda de confianza necesita un modelo que todavía no
            existe en el backend, y no queremos inventar uno acá. */}
        <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.5fr]">
          <div className="rounded-xl border border-border bg-card p-6 opacity-70 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                Salud financiera
              </p>
              <ProntoBadge />
            </div>
            <div className="flex items-center gap-5">
              <div
                className="flex size-16 shrink-0 items-center justify-center rounded-full border-4 border-dashed border-muted-foreground/20 font-mono text-lg text-muted-foreground/40"
              >
                —
              </div>
              <div className="flex-1 space-y-2">
                {['Liquidez', 'Cobranza', 'Control de gasto', 'Margen'].map((label) => (
                  <div key={label} className="flex items-center justify-between text-[12.5px]">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono text-muted-foreground/40">—</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 opacity-70 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                Caja proyectada · 30 días
              </p>
              <ProntoBadge />
            </div>
            <p className="font-mono text-[28px] font-medium tracking-tight text-muted-foreground/40">USD —.—</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Requiere un modelo de proyección de caja que todavía no está implementado.
            </p>
            <svg className="mt-5 h-14 w-full" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden>
              <polyline
                points="0,30 40,26 80,28 120,20 160,22 200,14 240,16 300,8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="text-muted-foreground/25"
              />
            </svg>
          </div>
        </div>

        {/* Concentración del ingreso: sí calculable con datos reales
            (clientId + totalCents de /invoices), a diferencia de las dos de
            arriba -- por eso no lleva insignia "Pronto". */}
        <div className="mb-3 rounded-xl border border-border bg-card p-6 shadow-xs">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <p className="text-sm font-semibold">Concentración del ingreso</p>
              <div className="text-[12px] text-muted-foreground">
                {loading ? (
                  <Skeleton className="mt-1 h-3.5 w-56" />
                ) : (
                  `${stats.clientConcentration.invoiceCount} facturas · ${PERIOD_LABELS[period].toLowerCase()} en curso`
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : stats.clientConcentration.distinctClients < 2 ? (
            <EmptyState
              title="Necesitás más de un cliente"
              description="Esta vista compara cuánto factura cada cliente. Con un solo cliente en el período no hay nada que concentrar."
            />
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-3">
                {stats.clientConcentration.rows.slice(0, 5).map((row, idx) => (
                  <span key={row.clientId} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: CLIENT_COLORS[idx] }}
                    />
                    Cliente #{row.clientId.slice(0, 6)}
                  </span>
                ))}
                {stats.clientConcentration.rows.length > 5 && (
                  <span className="text-[12px] text-muted-foreground/60">
                    +{stats.clientConcentration.rows.length - 5} más
                  </span>
                )}
              </div>
              <div className="flex h-24 items-end gap-1">
                {stats.clientConcentration.rows.map((row, idx) => (
                  <div
                    key={row.clientId}
                    className="flex-1 rounded-t-sm"
                    style={{
                      height: `${Math.max(6, (row.totalCents / stats.clientConcentration.rows[0].totalCents) * 100)}%`,
                      background: idx < 5 ? CLIENT_COLORS[idx] : CLIENT_COLOR_REST,
                    }}
                    title={`Cliente #${row.clientId.slice(0, 6)} · ${formatCents(row.totalCents)}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-border bg-card shadow-xs">
              <div className="flex items-center gap-2 border-b border-border px-6 py-4">
                <p className="text-sm font-semibold">Requiere atención</p>
                {!loading && requiereAtencion.length > 0 && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                    {requiereAtencion.length}
                  </span>
                )}
              </div>
              {loading ? (
                <div className="space-y-3 p-6">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ) : requiereAtencion.length === 0 ? (
                <EmptyState title="Todo en orden" description="No hay nada que requiera atención por ahora." />
              ) : (
                <ul>
                  {requiereAtencion.map((item) => (
                    <li key={item.label} className="flex items-start gap-2.5 border-b border-border px-6 py-3 last:border-0">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium">{item.label}</p>
                        <p className="truncate text-[12px] text-muted-foreground">{item.sub}</p>
                      </div>
                      <span className="font-mono text-[13px] text-destructive">{formatCents(item.cents)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 opacity-70 shadow-xs">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground">Caja disponible</p>
                <ProntoBadge />
              </div>
              <p className="font-mono text-[22px] font-medium text-muted-foreground/40">USD —.—</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Necesita una conexión con la cuenta/banco real, todavía no implementada.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-border bg-card shadow-xs">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <p className="text-sm font-semibold">Próximos movimientos</p>
                <span className="text-[12px] text-muted-foreground">30 días</span>
              </div>
              {loading ? (
                <div className="space-y-3 p-6">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ) : stats.upcomingInvoices.length === 0 ? (
                <EmptyState title="Nada por vencer" description="No hay facturas pendientes en los próximos 30 días." />
              ) : (
                <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
                  {stats.upcomingInvoices.map((inv) => (
                    <Link
                      key={inv.id}
                      href={`/dashboard/invoices/${inv.id}`}
                      className="rounded-lg border border-border p-3 transition-colors hover:border-primary/40"
                    >
                      <p className="text-[11px] text-muted-foreground">{formatDate(inv.expiration)}</p>
                      <p className="mt-0.5 truncate text-[13px] font-medium">Factura #{inv.id.slice(0, 8)}</p>
                      <p className="mt-1 font-mono text-[13px] text-success">+{formatCents(inv.totalCents)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card shadow-xs">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <p className="text-sm font-semibold">Actividad</p>
              </div>
              {loading ? (
                <div className="space-y-3 p-6">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ) : stats.recentActivity.length === 0 ? (
                <EmptyState title="Sin actividad todavía" description="Cuando registres una compra o factura, va a aparecer acá." />
              ) : (
                <ul>
                  {stats.recentActivity.map((entry) => (
                    <li key={`${entry.kind}-${entry.id}`} className="border-b border-border px-6 py-3 last:border-0">
                      <Link
                        href={`/dashboard/${entry.kind === 'purchase' ? 'purchases' : 'invoices'}/${entry.id}`}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          {entry.kind === 'purchase' ? (
                            <ShoppingCart size={14} strokeWidth={1.6} className="shrink-0 text-muted-foreground" />
                          ) : (
                            <Receipt size={14} strokeWidth={1.6} className="shrink-0 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-[13px]">
                              {entry.kind === 'purchase' ? 'Compra' : 'Factura'} #{entry.id.slice(0, 8)}
                            </p>
                            <p className="text-[11.5px] text-muted-foreground">{formatDate(entry.createdAt)}</p>
                          </div>
                        </div>
                        <span className="font-mono text-[13px]">{formatCents(entry.totalCents)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
