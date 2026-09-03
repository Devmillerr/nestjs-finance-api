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
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCents, formatDate } from '@/lib/format';
import { ApiError } from '@/lib/api';
import { ArrowLeft, Plus } from 'lucide-react';

interface InvoiceLine {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
}
interface InvoiceCharge {
  id: string;
  type: 'DISCOUNT' | 'OTHER' | 'TAX';
  amountCents: number;
  createdAt: string;
}
interface InvoiceDetail {
  id: string;
  clientId: string;
  paymentMethod: string;
  paymentStatus: string;
  expiration: string;
  createdAt: string;
  lines: InvoiceLine[];
  charges: InvoiceCharge[];
  subtotalCents: number;
  chargesCents: number;
  totalCents: number;
}

const STATUS_OPTIONS = ['COMPLETED', 'PENDING', 'NOT_COMPLETED', 'CANCELED'];
const CHARGE_TYPES = ['TAX', 'DISCOUNT', 'OTHER'];
const CHARGE_LABELS: Record<string, string> = {
  TAX: 'Impuesto',
  DISCOUNT: 'Descuento',
  OTHER: 'Otro',
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { authFetch } = useAuth();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const [chargeType, setChargeType] = useState('OTHER');
  const [chargeAmount, setChargeAmount] = useState('');
  const [addingCharge, setAddingCharge] = useState(false);

  const load = () => {
    authFetch(`/invoices/${id}`)
      .then((data) => setInvoice(data as InvoiceDetail))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setError('Esta factura no existe o no tenés acceso a ella.');
        } else {
          setError(err instanceof Error ? err.message : 'Error al cargar la factura');
        }
      });
  };

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function changeStatus(status: string) {
    setUpdating(true);
    try {
      await authFetch(`/invoices/${id}/status`, {
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

  async function addCharge() {
    const amountCents = Math.round(Number(chargeAmount) * 100);
    if (!amountCents || amountCents <= 0) {
      toast.error('Ingresá un monto válido para el cargo.');
      return;
    }
    setAddingCharge(true);
    try {
      await authFetch(`/invoices/${id}/charges`, {
        method: 'POST',
        body: JSON.stringify({ type: chargeType, amountCents }),
      });
      setChargeAmount('');
      toast.success('Cargo agregado');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo agregar el cargo');
    } finally {
      setAddingCharge(false);
    }
  }

  return (
    <>
      <Topbar title="Detalle de factura" />

      <div className="p-7">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver
        </button>

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {!error && !invoice && <p className="text-sm text-muted-foreground">Cargando…</p>}

        {invoice && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Emitida {formatDate(invoice.createdAt)} · vence {formatDate(invoice.expiration)} ·{' '}
                    {invoice.paymentMethod}
                  </p>
                  <p className="mt-1 font-mono text-3xl font-medium tracking-tight">
                    {formatCents(invoice.totalCents)}
                  </p>
                </div>
                <StatusBadge status={invoice.paymentStatus} />
              </div>

              <div className="mt-5 flex items-center gap-3 border-t border-border pt-5">
                <span className="text-sm text-muted-foreground">Estado</span>
                <StatusSelect
                  value={invoice.paymentStatus}
                  options={STATUS_OPTIONS}
                  disabled={updating}
                  onChange={changeStatus}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-xs">
              <div className="border-b border-border px-6 py-4">
                <p className="text-sm font-semibold">Líneas facturadas</p>
              </div>
              <Table>
                <TableBody>
                  {invoice.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <p>{line.name}</p>
                        {line.description && (
                          <p className="text-xs text-muted-foreground">{line.description}</p>
                        )}
                      </TableCell>
                      <TableCell align="right" className="font-mono">
                        {formatCents(line.priceCents)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-xs">
              <div className="border-b border-border px-6 py-4">
                <p className="text-sm font-semibold">Cargos</p>
                <p className="text-xs text-muted-foreground">
                  Ajustes posteriores a la emisión — nunca modifican las líneas originales.
                </p>
              </div>

              {invoice.charges.length > 0 && (
                <Table>
                  <TableBody>
                    {invoice.charges.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{CHARGE_LABELS[c.type]}</TableCell>
                        <TableCell align="right" className="font-mono">
                          {c.type === 'DISCOUNT' ? '−' : '+'}
                          {formatCents(c.amountCents)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="flex items-end gap-2 border-t border-border p-6">
                <Select value={chargeType} onValueChange={setChargeType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHARGE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {CHARGE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Monto"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  className="w-32"
                />
                <Button size="sm" disabled={addingCharge} onClick={addCharge}>
                  <Plus className="size-4" />
                  Agregar cargo
                </Button>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-border px-6 py-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCents(invoice.subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Cargos</span>
                  <span className="font-mono">{formatCents(invoice.chargesCents)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5 font-medium">
                  <span>Total</span>
                  <span className="font-mono">{formatCents(invoice.totalCents)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
