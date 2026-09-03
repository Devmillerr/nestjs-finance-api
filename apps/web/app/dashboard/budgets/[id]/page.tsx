'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { Topbar } from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { LedgerLabel, LedgerInput } from '@/components/ui/ledger-field';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import {
  BudgetLineEditor,
  emptyBudgetLine,
  type BudgetLineForm,
} from '@/components/budget-line-editor';
import { formatCents, formatDate } from '@/lib/format';
import { ApiError } from '@/lib/api';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';

interface BudgetLine {
  id: string;
  title: string | null;
  description: string | null;
  priceCents: number | null;
  productId: string | null;
}
interface BudgetDetail {
  id: string;
  clientId: string;
  description: string;
  createdAt: string;
  lines: BudgetLine[];
}
interface Product {
  id: string;
  name: string;
  priceCents: number;
}

export default function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { authFetch } = useAuth();
  const [budget, setBudget] = useState<BudgetDetail | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<BudgetLineForm[]>([]);

  const load = () => {
    authFetch(`/budgets/${id}`)
      .then((data) => setBudget(data as BudgetDetail))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setError('Este presupuesto no existe o no tenés acceso a él.');
        } else if (err instanceof ApiError && err.status === 403) {
          setError('No tenés permiso para ver este presupuesto.');
        } else {
          setError(err instanceof Error ? err.message : 'Error al cargar el presupuesto');
        }
      });
  };

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    authFetch('/products?limit=100')
      .then((data) => setProducts((data as { data: Product[] }).data))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startEditing() {
    if (!budget) return;
    setDescription(budget.description);
    setLines(
      budget.lines.map((l) => ({
        mode: l.productId ? 'product' : 'freeform',
        productId: l.productId ?? '',
        title: l.title ?? '',
        priceCents: l.priceCents !== null ? String(l.priceCents / 100) : '',
      })),
    );
    setEditing(true);
  }

  async function saveEdits() {
    const payloadLines = lines
      .map((l) =>
        l.mode === 'product'
          ? { productId: l.productId }
          : { title: l.title, priceCents: Math.round(Number(l.priceCents) * 100) },
      )
      .filter((l) => ('productId' in l && l.productId) || ('title' in l && l.title));

    if (payloadLines.length === 0) {
      setError('Agregá al menos una línea.');
      return;
    }

    setSaving(true);
    try {
      await authFetch(`/budgets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ description, lines: payloadLines }),
      });
      setEditing(false);
      toast.success('Presupuesto actualizado');
      load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar el presupuesto';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function performDelete() {
    try {
      await authFetch(`/budgets/${id}`, { method: 'DELETE' });
      toast.success('Presupuesto eliminado');
      router.push('/dashboard/budgets');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo eliminar el presupuesto';
      setError(message);
      toast.error(message);
    }
  }

  const total = budget?.lines.reduce((sum, l) => sum + (l.priceCents ?? 0), 0) ?? 0;

  return (
    <>
      <Topbar title="Detalle de presupuesto" />

      <div className="max-w-2xl p-7">
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

        {!error && !budget && <p className="text-sm text-muted-foreground">Cargando…</p>}

        {budget && !editing && (
          <div className="rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-start justify-between border-b border-border p-6">
              <div>
                <p className="text-xs text-muted-foreground">{formatDate(budget.createdAt)}</p>
                <p className="font-medium">{budget.description}</p>
              </div>
              <div className="flex gap-2">
                {/* Solo el dueño o ADMIN/OWNER pueden editar/borrar (OwnershipGuard
                    en el backend). Se muestra siempre; el backend responde 403
                    si no corresponde. */}
                <Button variant="outline" size="icon" onClick={startEditing}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setConfirmOpen(true)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            <Table>
              <TableBody>
                {budget.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.title}</TableCell>
                    <TableCell align="right" className="font-mono">
                      {formatCents(line.priceCents ?? 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-baseline justify-between border-t border-border px-6 py-4">
              <span className="text-sm font-medium">Total estimado</span>
              <span className="font-mono text-xl font-medium">{formatCents(total)}</span>
            </div>
          </div>
        )}

        {budget && editing && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <h2 className="mb-6 text-[15px] font-semibold">Editar presupuesto</h2>
            <div className="mb-6">
              <LedgerLabel>DESCRIPCIÓN</LedgerLabel>
              <LedgerInput value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <BudgetLineEditor
              lines={lines}
              products={products}
              onChange={(i, patch) =>
                setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
              }
              onAdd={() => setLines((prev) => [...prev, emptyBudgetLine()])}
              onRemove={(i) => setLines((prev) => prev.filter((_, idx) => idx !== i))}
            />

            <div className="mt-4 flex gap-2">
              <Button disabled={saving} onClick={saveEdits}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar presupuesto"
        description="Esta acción no se puede deshacer. El presupuesto y sus líneas se van a borrar de forma permanente."
        onConfirm={performDelete}
      />
    </>
  );
}
