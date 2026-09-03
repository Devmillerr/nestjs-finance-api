'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Topbar } from '@/components/layout/topbar';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { TableRowsSkeleton } from '@/components/table-rows-skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { formatCents, formatDate } from '@/lib/format';
import {} from 'lucide-react';

interface PaginatedMeta {
  total: number;
}
interface Purchase {
  id: string;
  totalCents: number;
  paymentStatus: string;
  createdAt: string;
}
interface Invoice {
  id: string;
  paymentStatus: string;
  totalCents: number;
  createdAt: string;
}

// Sparkline construido con los montos REALES de las últimas 5 compras (las
// que ya traemos para "Compras recientes") -- no es una serie histórica
// inventada. Con pocos puntos y sin fechas equiespaciadas, es una lectura
// aproximada de actividad reciente, no un gráfico de tendencia riguroso;
// por eso vive dentro de la card, chico, sin ejes ni leyenda que sugieran
// más precisión de la que hay.
function buildSparklinePoints(purchases: Purchase[]): string {
  if (purchases.length < 2) return '';
  const chronological = [...purchases].reverse();
  const values = chronological.map((p) => p.totalCents);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 68;
  const h = 26;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export default function DashboardPage() {
  const { authFetch } = useAuth();
  const [purchases, setPurchases] = useState<{ data: Purchase[]; meta: PaginatedMeta } | null>(
    null,
  );
  const [invoices, setInvoices] = useState<{ data: Invoice[]; meta: PaginatedMeta } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, i] = await Promise.all([
          authFetch('/purchases?limit=5'),
          authFetch('/invoices?limit=5'),
        ]);
        setPurchases(p as typeof purchases);
        setInvoices(i as typeof invoices);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sparkPoints = purchases ? buildSparklinePoints(purchases.data) : '';

  return (
    <>
      <Topbar title="Dashboard" subtitle="Resumen general" />

      <div className="p-7">
        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Folio Cards con jerarquía: la métrica primaria (Compras) es más
            grande y lleva el sparkline; la secundaria (Facturas) es más
            chica -- a propósito, para no repetir el "kit de cards idénticas"
            que ya identificamos como cliché genérico. */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_1fr]">
          <Link
            href="/dashboard/purchases"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-6 shadow-xs transition-colors hover:border-primary/40"
          >
            <div>
              <p className="text-sm text-muted-foreground">Compras totales</p>
              {purchases === null ? (
                <Skeleton className="mt-1.5 h-9 w-14" />
              ) : (
                <p className="mt-0.5 font-mono text-4xl font-medium tracking-tight">
                  {purchases.meta.total}
                </p>
              )}
            </div>
            {sparkPoints && (
              <svg width="68" height="26" viewBox="0 0 68 26" className="shrink-0" aria-hidden>
                <polyline
                  points={sparkPoints}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </Link>

          <Link
            href="/dashboard/invoices"
            className="flex flex-col justify-center rounded-xl border border-border bg-card p-6 shadow-xs transition-colors hover:border-primary/40"
          >
            <p className="text-sm text-muted-foreground">Facturas totales</p>
            {invoices === null ? (
              <Skeleton className="mt-1.5 h-9 w-14" />
            ) : (
              <p className="mt-0.5 font-mono text-4xl font-medium tracking-tight">
                {invoices.meta.total}
              </p>
            )}
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <p className="text-sm font-semibold">Compras recientes</p>
            <Link href="/dashboard/purchases" className="text-xs font-medium text-primary">
              Ver todas →
            </Link>
          </div>

          {purchases?.data.length === 0 ? (
            <EmptyState
              title="Sin actividad todavía"
              description="Cuando registres tu primera compra, va a aparecer acá."
            />
          ) : (
            <Table>
              <TableBody>
                {purchases === null ? (
                  <TableRowsSkeleton cols={3} />
                ) : (
                  purchases.data.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/dashboard/purchases/${p.id}`} className="hover:underline">
                          {formatDate(p.createdAt)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={p.paymentStatus} />
                      </TableCell>
                      <TableCell align="right" className="font-mono">
                        {formatCents(p.totalCents)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </>
  );
}
