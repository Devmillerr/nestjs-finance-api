'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { getErrorMessage } from '@/lib/api';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { TableRowsSkeleton } from '@/components/table-rows-skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCents, formatDate } from '@/lib/format';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface Purchase {
  id: string;
  clientId: string;
  paymentMethod: string;
  paymentStatus: string;
  totalCents: number;
  createdAt: string;
}
interface PaginatedResponse {
  data: Purchase[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export default function PurchasesListPage() {
  const { authFetch } = useAuth();
  const [result, setResult] = useState<PaginatedResponse | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authFetch(`/purchases?page=${page}&limit=10`)
      .then((data) => setResult(data as PaginatedResponse))
      .catch((err) =>
        setError(getErrorMessage(err, 'Error al cargar compras')),
      );
  }, [authFetch, page]);

  return (
    <>
      <Topbar title="Compras" subtitle="Historial de compras de clientes" />

      <div className="p-7">
        <PageHeader
          description={result ? `${result.meta.total} en total` : undefined}
          actions={
            <Button asChild size="sm">
              <Link href="/dashboard/purchases/new">
                <Plus className="size-4" />
                Nueva compra
              </Link>
            </Button>
          }
        />

        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          {result?.data.length === 0 ? (
            <EmptyState
              title="Sin compras todavía"
              description="Las compras que registres para tus clientes van a aparecer acá."
              action={
                <Link
                  href="/dashboard/purchases/new"
                  className="font-mono text-xs text-primary border-b border-primary pb-px"
                >
                  Registrar la primera →
                </Link>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead align="right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result === null ? (
                  <TableRowsSkeleton cols={4} />
                ) : (
                  result.data.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/dashboard/purchases/${p.id}`} className="hover:underline">
                          {formatDate(p.createdAt)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.paymentMethod}</TableCell>
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

          {result && result.meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Página {result.meta.page} de {result.meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Página anterior"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Página siguiente"
                  disabled={page >= result.meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
