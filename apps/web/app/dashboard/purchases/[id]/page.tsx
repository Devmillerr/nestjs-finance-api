'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { Topbar } from '@/components/layout/topbar';
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
import { ApiError } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
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

  const load = () => {
    authFetch(`/purchases/${id}`)
      .then((data) => setPurchase(data as PurchaseDetail))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setError('Esta compra no existe o no tenés acceso a ella.');
        } else {
          setError(err instanceof Error ? err.message : 'Error al cargar la compra');
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
      const message = err instanceof Error ? err.message : 'No se pudo actualizar el estado';
      setError(message);
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <>
      <Topbar title="Detalle de compra" />

      <div className="p-7">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver
        </button>

        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {!error && !purchase && (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        )}

        {purchase && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(purchase.createdAt)} · {purchase.paymentMethod}
                  </p>
                  <p className="mt-1 font-mono text-3xl font-medium tracking-tight">
                    {formatCents(purchase.totalCents)}
                  </p>
                </div>
                <StatusBadge status={purchase.paymentStatus} />
              </div>

              {/* El cambio de estado es exclusivo de ADMIN/OWNER en el backend
                  (RolesGuard). El access token no lleva rol -- se muestra
                  siempre, el backend responde 403 si no corresponde. */}
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
    </>
  );
}
