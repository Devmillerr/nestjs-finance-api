'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { getErrorMessage } from '@/lib/api';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/page-header';
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

interface BudgetLine {
  priceCents: number | null;
}
interface Budget {
  id: string;
  description: string;
  createdAt: string;
  lines: BudgetLine[];
}
interface PaginatedResponse {
  data: Budget[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

function budgetTotal(budget: Budget): number {
  return budget.lines.reduce((sum, l) => sum + (l.priceCents ?? 0), 0);
}

export default function BudgetsListPage() {
  const { authFetch } = useAuth();
  const [result, setResult] = useState<PaginatedResponse | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authFetch(`/budgets?page=${page}&limit=10`)
      .then((data) => setResult(data as PaginatedResponse))
      .catch((err) =>
        setError(getErrorMessage(err, 'Error al cargar presupuestos')),
      );
  }, [authFetch, page]);

  return (
    <>
      <Topbar title="Presupuestos" subtitle="Propuestas para clientes" />

      <div className="p-7">
        <PageHeader
          description={result ? `${result.meta.total} en total` : undefined}
          actions={
            <Button asChild size="sm">
              <Link href="/dashboard/budgets/new">
                <Plus className="size-4" />
                Nuevo presupuesto
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
              title="Sin presupuestos todavía"
              description="Las propuestas que armes para tus clientes van a aparecer acá."
              action={
                <Link
                  href="/dashboard/budgets/new"
                  className="font-mono text-xs text-primary border-b border-primary pb-px"
                >
                  Crear el primero →
                </Link>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Líneas</TableHead>
                  <TableHead align="right">Total estimado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result === null ? (
                  <TableRowsSkeleton cols={4} />
                ) : (
                  result.data.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <Link href={`/dashboard/budgets/${b.id}`} className="hover:underline">
                          {formatDate(b.createdAt)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{b.description}</TableCell>
                      <TableCell className="text-muted-foreground">{b.lines.length}</TableCell>
                      <TableCell align="right" className="font-mono">
                        {formatCents(budgetTotal(b))}
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
