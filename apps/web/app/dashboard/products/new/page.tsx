'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { getErrorMessage } from '@/lib/api';
import { Topbar } from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { LedgerLabel, LedgerInput, LedgerSelect } from '@/components/ui/ledger-field';

const TYPES = [
  { value: 'WEB', label: 'Web' },
  { value: 'FIVEM', label: 'FiveM' },
  { value: 'DISCORD_BOT', label: 'Discord Bot' },
];

export default function NewProductPage() {
  const { authFetch } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [type, setType] = useState('WEB');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    const priceCents = Math.round(Number(price) * 100);
    if (!name.trim() || !description.trim() || !priceCents || !photoUrl.trim()) {
      setError('Completá todos los campos.');
      return;
    }

    setSubmitting(true);
    try {
      const product = (await authFetch('/products', {
        method: 'POST',
        body: JSON.stringify({ name, description, priceCents, photoUrl, type }),
      })) as { id: string };
      toast.success('Producto creado');
      router.push(`/dashboard/products/${product.id}`);
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudo crear el producto');
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Topbar title="Nuevo producto" />

      <div className="max-w-lg p-7">
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <h2 className="mb-6 text-[15px] font-semibold">Nuevo producto</h2>

          <div className="mb-5">
            <LedgerLabel>NOMBRE</LedgerLabel>
            <LedgerInput value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="mb-5">
            <LedgerLabel>DESCRIPCIÓN</LedgerLabel>
            <LedgerInput value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="mb-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <LedgerLabel>PRECIO</LedgerLabel>
              <LedgerInput type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="font-mono" />
            </div>
            <div>
              <LedgerLabel>TIPO</LedgerLabel>
              <LedgerSelect value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </LedgerSelect>
            </div>
          </div>
          <div className="mb-6">
            <LedgerLabel>URL DE IMAGEN</LedgerLabel>
            <LedgerInput value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" />
          </div>

          {error && (
            <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <Button className="w-full" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Creando…' : 'Crear producto'}
          </Button>
        </div>
      </div>
    </>
  );
}
