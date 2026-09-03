'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { Topbar } from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { LedgerLabel, LedgerInput, LedgerSelect } from '@/components/ui/ledger-field';
import { formatCents } from '@/lib/format';
import { Plus, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  priceCents: number;
}
interface Line {
  productId: string;
  quantity: number;
}

const PAYMENT_METHODS = ['PAYPAL', 'STRIPE', 'CRYPTO'];

export default function NewPurchasePage() {
  const { authFetch } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [lines, setLines] = useState<Line[]>([{ productId: '', quantity: 1 }]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    authFetch('/products?limit=100')
      .then((data) => setProducts((data as { data: Product[] }).data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar productos'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const productById = (id: string) => products.find((p) => p.id === id);

  // Preview de UI únicamente: el total real, con el precio SNAPSHOT
  // congelado, lo calcula el backend dentro de la transacción. Si el precio
  // del catálogo cambió entre que se cargó esta página y que se envía el
  // form, este número puede no coincidir con el que finalmente se guarda --
  // es esperado, no un bug.
  const previewTotal = lines.reduce((sum, line) => {
    const product = productById(line.productId);
    return sum + (product ? product.priceCents * line.quantity : 0);
  }, 0);

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { productId: '', quantity: 1 }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setError(null);
    const validLines = lines.filter((l) => l.productId && l.quantity > 0);
    if (validLines.length === 0) {
      setError('Agregá al menos una línea con producto y cantidad.');
      return;
    }

    setSubmitting(true);
    try {
      const purchase = (await authFetch('/purchases', {
        method: 'POST',
        body: JSON.stringify({ paymentMethod, lines: validLines }),
      })) as { id: string };
      toast.success('Compra creada');
      router.push(`/dashboard/purchases/${purchase.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear la compra';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Topbar title="Nueva compra" />

      <div className="max-w-2xl p-7">
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <h2 className="mb-6 text-[15px] font-semibold">Nueva compra</h2>

          <div className="mb-6">
            <LedgerLabel>MÉTODO DE PAGO</LedgerLabel>
            <LedgerSelect value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </LedgerSelect>
          </div>

          {/* Líneas como filas de ledger: separadas por una regla fina, no
              cada una en su propia caja. */}
          <div className="mb-1">
            {lines.map((line, index) => (
              <div
                key={index}
                className="flex items-center gap-3 border-b border-border py-3 first:border-t"
              >
                <LedgerSelect
                  value={line.productId}
                  onChange={(e) => updateLine(index, { productId: e.target.value })}
                  className="flex-1 border-b-0 py-0"
                >
                  <option value="">Seleccioná un producto…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatCents(p.priceCents)}
                    </option>
                  ))}
                </LedgerSelect>
                <LedgerInput
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })}
                  className="w-14 border-b-0 py-0 text-right font-mono"
                />
                <button
                  type="button"
                  disabled={lines.length === 1}
                  onClick={() => removeLine(index)}
                  className="text-muted-foreground/50 transition-colors hover:text-destructive disabled:opacity-30"
                >
                  <Trash2 size={15} strokeWidth={1.6} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addLine}
            className="mt-3 flex items-center gap-1.5 text-[13px] text-primary transition-opacity hover:opacity-75"
          >
            <Plus size={14} strokeWidth={1.8} />
            Agregar línea
          </button>

          <div className="mt-6 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-mono text-[10.5px] tracking-wide text-muted-foreground">
              TOTAL ESTIMADO
            </span>
            <span className="font-mono text-xl font-medium">{formatCents(previewTotal)}</span>
          </div>

          {error && (
            <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button className="mt-5 w-full" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Creando…' : 'Crear compra'}
          </Button>
        </div>
      </div>
    </>
  );
}
