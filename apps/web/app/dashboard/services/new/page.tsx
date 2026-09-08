'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { getErrorMessage } from '@/lib/api';
import { Topbar } from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { LedgerLabel, LedgerInput } from '@/components/ui/ledger-field';

export default function NewServicePage() {
  const { authFetch } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
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
      const service = (await authFetch('/services', {
        method: 'POST',
        body: JSON.stringify({ name, description, priceCents, photoUrl }),
      })) as { id: string };
      toast.success('Servicio creado');
      router.push(`/dashboard/services/${service.id}`);
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudo crear el servicio');
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Topbar title="Nuevo servicio" />

      <div className="max-w-lg p-7">
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <h2 className="mb-6 text-[15px] font-semibold">Nuevo servicio</h2>

          <div className="mb-5">
            <LedgerLabel>NOMBRE</LedgerLabel>
            <LedgerInput value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="mb-5">
            <LedgerLabel>DESCRIPCIÓN</LedgerLabel>
            <LedgerInput value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="mb-5">
            <LedgerLabel>PRECIO</LedgerLabel>
            <LedgerInput type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="font-mono" />
          </div>
          <div className="mb-6">
            <LedgerLabel>URL DE IMAGEN</LedgerLabel>
            <LedgerInput value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" />
          </div>

          {error && (
            <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <Button className="w-full" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Creando…' : 'Crear servicio'}
          </Button>
        </div>
      </div>
    </>
  );
}
