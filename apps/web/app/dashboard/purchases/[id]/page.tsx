'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { Topbar } from '@/components/layout/topbar';
import { BackLink } from '@/components/back-link';
import { DetailSkeleton } from '@/components/detail-skeleton';
import { StatusBadge } from '@/components/status-badge';
import { StatusSelect } from '@/components/status-select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCents, formatDate } from '@/lib/format';
import { ApiError, getErrorMessage } from '@/lib/api';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';

interface PurchaseLine {
  id: string;
  quantity: number;
  unitPriceCents: number;
  product: { id: string; name: string };
}
interface PurchaseDetail {
  id: string;
  clientId: string;
  paymentMethod: string;
  paymentStatus: string;
  totalCents: number;
  createdAt: string;
  lines: PurchaseLine[];
}

const STATUS_OPTIONS = ['COMPLETED', 'PENDING', 'NOT_COMPLETED', 'CANCELED'];

export default function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { authFetch } = useAuth();
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = () => {
    authFetch(`/purchases/${id}`)
      .then((data) => setPurchase(data as PurchaseDetail))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setError('Esta compra no existe o no tenés acceso a ella.');
        } else if (err instanceof ApiError && err.status === 403) {
          setError('No tenés permiso para ver esta compra.');
        } else {
          setError(getErrorMessage(err, 'Error al cargar la compra'));
        }
      });
  };

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function changeStatus(status: string) {
    setUpdating(true);
    try {
      await authFetch(`/purchases/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus: status }),
      });
      toast.success('Estado actualizado');
      load();
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudo actualizar el estado');
      setError(message);
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  }

  async function performDelete() {
    try {
      await authFetch(`/purchases/${id}`, { method: 'DELETE' });
      toast.success('Compra eliminada');
      router.push('/dashboard/purchases');
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudo eliminar la compra');
      setError(message);
      toast.error(message);
    }
  }

  return (
    <>
      <Topbar title="Detalle de compra" />

      <div className="p-7">
        <BackLink />

        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {!error && !purchase && <DetailSkeleton cards={2} />}

        {purchase && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-y-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(purchase.createdAt)} · {purchase.paymentMethod}
                  </p>
                  <p className="mt-1 font-mono text-3xl font-medium tracking-tight">
                    {formatCents(purchase.totalCents)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={purchase.paymentStatus} />
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Eliminar compra"
                    onClick={() => setConfirmOpen(true)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {/* El cambio de estado y el borrado son exclusivos de ADMIN/OWNER
                  en el backend (RolesGuard). El access token no lleva rol -- se
                  muestran siempre, el backend responde 403 si no corresponde. */}
              <div className="mt-5 flex items-center gap-3 border-t border-border pt-5">
                <span className="text-sm text-muted-foreground">Estado</span>
                <StatusSelect
                  value={purchase.paymentStatus}
                  options={STATUS_OPTIONS}
                  disabled={updating}
                  onChange={changeStatus}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-xs">
              <div className="border-b border-border px-6 py-4">
                <p className="text-sm font-semibold">Líneas de la compra</p>
                <p className="text-xs text-muted-foreground">
                  Precio congelado al momento de la compra — no cambia si el producto cambia de precio después.
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead align="right">Cantidad</TableHead>
                    <TableHead align="right">Precio unit.</TableHead>
                    <TableHead align="right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/products/${line.product.id}`}
                          className="text-primary hover:underline"
                        >
                          {line.product.name}
                        </Link>
                      </TableCell>
                      <TableCell align="right" className="font-mono">{line.quantity}</TableCell>
                      <TableCell align="right" className="font-mono">
                        {formatCents(line.unitPriceCents)}
                      </TableCell>
                      <TableCell align="right" className="font-mono">
                        {formatCents(line.unitPriceCents * line.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar compra"
        description="Esta acción no se puede deshacer. La compra y sus líneas se van a borrar de forma permanente."
        onConfirm={performDelete}
      />
    </>
  );
}
