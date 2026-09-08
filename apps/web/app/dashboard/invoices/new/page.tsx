'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { getErrorMessage } from '@/lib/api';
import { Topbar } from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { LedgerLabel, LedgerInput, LedgerSelect } from '@/components/ui/ledger-field';
import { formatCents } from '@/lib/format';
import { Plus, Trash2 } from 'lucide-react';

interface Client {
  id: string;
  email: string;
}
interface Product {
  id: string;
  name: string;
  priceCents: number;
}
interface Service {
  id: string;
  name: string;
  priceCents: number;
}
interface Line {
  mode: 'catalog' | 'freeform';
  // Codificado como "product:<id>" o "service:<id>" -- un solo <select> para
  // todo el catálogo, en vez de una pestaña más en el toggle de arriba.
  catalogRef: string;
  name: string;
  priceCents: string; // string mientras se edita, se convierte a centavos al enviar
}

const PAYMENT_METHODS = ['PAYPAL', 'STRIPE', 'CRYPTO'];

function emptyLine(): Line {
  return { mode: 'catalog', catalogRef: '', name: '', priceCents: '' };
}

export default function NewInvoicePage() {
  const { authFetch } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clientId, setClientId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [expiration, setExpiration] = useState('');
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // GET /users y la creación de facturas son ambas ADMIN/OWNER-only en el
    // backend -- si un USER llega a esta página igual, esta llamada le va a
    // devolver 403, y el error se muestra abajo. Consistente con cómo
    // tratamos el resto de las acciones restringidas por rol en el frontend.
    authFetch('/users?limit=100')
      .then((data) => setClients((data as { data: Client[] }).data))
      .catch((err) => setError(getErrorMessage(err, 'Error al cargar clientes')));
    authFetch('/products?limit=100')
      .then((data) => setProducts((data as { data: Product[] }).data))
      .catch((err) => setError(getErrorMessage(err, 'Error al cargar productos')));
    authFetch('/services?limit=100')
      .then((data) => setServices((data as { data: Service[] }).data))
      .catch((err) => setError(getErrorMessage(err, 'Error al cargar servicios')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setError(null);
    if (!clientId) {
      setError('Seleccioná un cliente.');
      return;
    }
    if (!expiration) {
      setError('Indicá una fecha de vencimiento.');
      return;
    }

    const payloadLines = lines
      .map((l) => {
        if (l.mode !== 'catalog') {
          return { name: l.name, priceCents: Math.round(Number(l.priceCents) * 100) };
        }
        const [kind, refId] = l.catalogRef.split(':');
        if (kind === 'service') return { serviceId: refId };
        return { productId: refId };
      })
      .filter(
        (l) =>
          ('productId' in l && l.productId) ||
          ('serviceId' in l && l.serviceId) ||
          ('name' in l && l.name),
      );

    if (payloadLines.length === 0) {
      setError('Agregá al menos una línea.');
      return;
    }

    setSubmitting(true);
    try {
      const invoice = (await authFetch('/invoices', {
        method: 'POST',
        body: JSON.stringify({
          clientId,
          paymentMethod,
          expiration: new Date(expiration).toISOString(),
          lines: payloadLines,
        }),
      })) as { id: string };
      toast.success('Factura emitida');
      router.push(`/dashboard/invoices/${invoice.id}`);
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudo crear la factura');
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Topbar title="Nueva factura" />

      <div className="max-w-2xl p-7">
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <h2 className="mb-6 text-[15px] font-semibold">Nueva factura</h2>

          <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <LedgerLabel>CLIENTE</LedgerLabel>
              <LedgerSelect value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">Seleccioná un cliente…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.email}
                  </option>
                ))}
              </LedgerSelect>
            </div>
            <div>
              <LedgerLabel>MÉTODO DE PAGO</LedgerLabel>
              <LedgerSelect value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </LedgerSelect>
            </div>
          </div>

          <div className="mb-6">
            <LedgerLabel>VENCE</LedgerLabel>
            <LedgerInput
              type="date"
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
            />
          </div>

          <div className="mb-2 border-t border-border pt-1">
            {lines.map((line, index) => (
              <div key={index} className="border-b border-border py-3.5">
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => updateLine(index, { mode: 'catalog' })}
                      className={`text-[12px] font-mono tracking-wide transition-colors ${line.mode === 'catalog' ? 'text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground'}`}
                    >
                      DEL CATÁLOGO
                    </button>
                    <button
                      type="button"
                      onClick={() => updateLine(index, { mode: 'freeform' })}
                      className={`text-[12px] font-mono tracking-wide transition-colors ${line.mode === 'freeform' ? 'text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground'}`}
                    >
                      ÍTEM LIBRE
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label="Quitar línea"
                    disabled={lines.length === 1}
                    onClick={() => removeLine(index)}
                    className="text-muted-foreground/50 transition-colors hover:text-destructive disabled:opacity-30"
                  >
                    <Trash2 size={15} strokeWidth={1.6} />
                  </button>
                </div>

                {line.mode === 'catalog' ? (
                  <LedgerSelect
                    value={line.catalogRef}
                    onChange={(e) => updateLine(index, { catalogRef: e.target.value })}
                  >
                    <option value="">Seleccioná del catálogo…</option>
                    {products.length > 0 && (
                      <optgroup label="Productos">
                        {products.map((p) => (
                          <option key={`product:${p.id}`} value={`product:${p.id}`}>
                            {p.name} — {formatCents(p.priceCents)}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {services.length > 0 && (
                      <optgroup label="Servicios">
                        {services.map((s) => (
                          <option key={`service:${s.id}`} value={`service:${s.id}`}>
                            {s.name} — {formatCents(s.priceCents)}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </LedgerSelect>
                ) : (
                  <div className="flex gap-4">
                    <LedgerInput
                      placeholder="Nombre del ítem"
                      value={line.name}
                      onChange={(e) => updateLine(index, { name: e.target.value })}
                      className="flex-1"
                    />
                    <LedgerInput
                      type="number"
                      step="0.01"
                      placeholder="Precio"
                      className="w-28 text-right font-mono"
                      value={line.priceCents}
                      onChange={(e) => updateLine(index, { priceCents: e.target.value })}
                    />
                  </div>
                )}
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

          {error && (
            <p className="mt-5 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button className="mt-5 w-full" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Emitiendo…' : 'Emitir factura'}
          </Button>
        </div>
      </div>
    </>
  );
}
