'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { Topbar } from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { LedgerLabel, LedgerInput } from '@/components/ui/ledger-field';
import {
  BudgetLineEditor,
  emptyBudgetLine,
  type BudgetLineForm,
} from '@/components/budget-line-editor';

interface Product {
  id: string;
  name: string;
  priceCents: number;
}

export default function NewBudgetPage() {
  const { authFetch } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<BudgetLineForm[]>([emptyBudgetLine()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    authFetch('/products?limit=100')
      .then((data) => setProducts((data as { data: Product[] }).data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar productos'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateLine(index: number, patch: Partial<BudgetLineForm>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  async function handleSubmit() {
    setError(null);
    if (!description.trim()) {
      setError('Ingresá una descripción para el presupuesto.');
      return;
    }

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

    setSubmitting(true);
    try {
      const budget = (await authFetch('/budgets', {
        method: 'POST',
        body: JSON.stringify({ description, lines: payloadLines }),
      })) as { id: string };
      toast.success('Presupuesto creado');
      router.push(`/dashboard/budgets/${budget.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear el presupuesto';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Topbar title="Nuevo presupuesto" />

      <div className="max-w-2xl p-7">
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <h2 className="mb-6 text-[15px] font-semibold">Nuevo presupuesto</h2>

          <div className="mb-6">
            <LedgerLabel>DESCRIPCIÓN</LedgerLabel>
            <LedgerInput
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Rediseño de sitio web — propuesta inicial"
            />
          </div>

          <BudgetLineEditor
            lines={lines}
            products={products}
            onChange={updateLine}
            onAdd={() => setLines((prev) => [...prev, emptyBudgetLine()])}
            onRemove={(i) => setLines((prev) => prev.filter((_, idx) => idx !== i))}
          />

          {error && (
            <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button className="mt-4 w-full" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Creando…' : 'Crear presupuesto'}
          </Button>
        </div>
      </div>
    </>
  );
}
