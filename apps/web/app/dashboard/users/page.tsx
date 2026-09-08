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
import { formatDate } from '@/lib/format';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface UserRow {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}
interface PaginatedResponse {
  data: UserRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export default function UsersListPage() {
  const { authFetch } = useAuth();
  const [result, setResult] = useState<PaginatedResponse | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // GET /users es ADMIN/OWNER-only en el backend. Si un USER llega acá,
    // la llamada devuelve 403 y se muestra el error abajo -- no hay forma
    // confiable de ocultar el link de navegación de antemano (el JWT no
    // lleva rol, ver nota en purchases/[id]).
    authFetch(`/users?page=${page}&limit=10`)
      .then((data) => setResult(data as PaginatedResponse))
      .catch((err) =>
        setError(getErrorMessage(err, 'Error al cargar usuarios')),
      );
  }, [authFetch, page]);

  return (
    <>
      <Topbar title="Usuarios" subtitle="Clientes y equipo" />

      <div className="p-7">
        <PageHeader
          description={result ? `${result.meta.total} en total` : undefined}
        />

        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          {result?.data.length === 0 ? (
            <EmptyState
              title="Sin usuarios"
              description="Los usuarios que se registren van a aparecer acá."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Registrado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result === null ? (
                  <TableRowsSkeleton cols={4} />
                ) : (
                  result.data.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <Link href={`/dashboard/users/${u.id}`} className="hover:underline">
                          {u.email}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.role}</TableCell>
                      <TableCell>
                        {u.isActive ? (
                          <span className="text-success">Activo</span>
                        ) : (
                          <span className="text-muted-foreground">Desactivado</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(u.createdAt)}
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
