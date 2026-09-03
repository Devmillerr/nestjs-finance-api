'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCents } from '@/lib/format';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  priceCents: number;
}
interface PaginatedResponse {
  data: Service[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export default function ServicesListPage() {
  const { authFetch } = useAuth();
  const [result, setResult] = useState<PaginatedResponse | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authFetch(`/services?page=${page}&limit=10`)
      .then((data) => setResult(data as PaginatedResponse))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Error al cargar servicios'),
      );
  }, [authFetch, page]);

  return (
    <>
      <Topbar title="Servicios" subtitle="Catálogo de servicios" />

      <div className="p-7">
        <PageHeader
          title="Servicios"
          description={result ? `${result.meta.total} en el catálogo` : undefined}
          actions={
            <Button asChild size="sm">
              <Link href="/dashboard/services/new">
                <Plus className="size-4" />
                Nuevo servicio
              </Link>
            </Button>
          }
        />

        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {result?.data.length === 0 ? (
          <div className="rounded-xl border border-border bg-card shadow-xs">
            <EmptyState
              title="Catálogo vacío"
              description="Los servicios que ofrezcas a tus clientes van a aparecer acá."
              action={
                <Link
                  href="/dashboard/services/new"
                  className="font-mono text-xs text-primary border-b border-primary pb-px"
                >
                  Agregar el primero →
                </Link>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result === null
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-xs">
                    <Skeleton className="mb-2 h-4 w-2/3" />
                    <Skeleton className="mb-4 h-3 w-full" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))
              : result.data.map((s) => (
                  <Link
                    key={s.id}
                    href={`/dashboard/services/${s.id}`}
                    className="group rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/40"
                  >
                    <p className="font-medium">{s.name}</p>
                    <p className="mt-1 mb-4 line-clamp-2 text-sm text-muted-foreground">
                      {s.description}
                    </p>
                    <p className="font-mono text-lg font-medium">{formatCents(s.priceCents)}</p>
                  </Link>
                ))}
          </div>
        )}

        {result && result.meta.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Página {result.meta.page} de {result.meta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= result.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
