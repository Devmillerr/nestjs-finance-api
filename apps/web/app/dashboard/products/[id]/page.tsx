'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { Topbar } from '@/components/layout/topbar';
import { BackLink } from '@/components/back-link';
import { DetailSkeleton } from '@/components/detail-skeleton';
import { Button } from '@/components/ui/button';
import { LedgerLabel, LedgerInput, LedgerSelect } from '@/components/ui/ledger-field';
import { formatCents } from '@/lib/format';
import { ApiError, getErrorMessage } from '@/lib/api';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Pencil, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  photoUrl: string;
  type: string;
}

const TYPES = [
  { value: 'WEB', label: 'Web' },
  { value: 'FIVEM', label: 'FiveM' },
  { value: 'DISCORD_BOT', label: 'Discord Bot' },
];
const TYPE_LABELS: Record<string, string> = { WEB: 'Web', FIVEM: 'FiveM', DISCORD_BOT: 'Discord Bot' };

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { authFetch } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [type, setType] = useState('WEB');

  const load = () => {
    authFetch(`/products/${id}`)
      .then((data) => setProduct(data as Product))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setError('Este producto no existe.');
        } else {
          setError(getErrorMessage(err, 'Error al cargar el producto'));
        }
      });
  };

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  function startEditing() {
    if (!product) return;
    setName(product.name);
    setDescription(product.description);
    setPrice(String(product.priceCents / 100));
    setPhotoUrl(product.photoUrl);
    setType(product.type);
    setEditing(true);
  }

  async function saveEdits() {
    setSaving(true);
    try {
      await authFetch(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          description,
          priceCents: Math.round(Number(price) * 100),
          photoUrl,
          type,
        }),
      });
      setEditing(false);
      toast.success('Producto actualizado');
      load();
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudo guardar el producto');
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function performDelete() {
    try {
      await authFetch(`/products/${id}`, { method: 'DELETE' });
      toast.success('Producto eliminado');
      router.push('/dashboard/products');
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudo eliminar el producto');
      setError(message);
      toast.error(message);
    }
  }

  return (
    <>
      <Topbar title="Detalle de producto" />

      <div className="max-w-lg p-7">
        <BackLink />

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
        )}

        {!error && !product && <DetailSkeleton />}

        {product && !editing && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-y-2">
              <div className="min-w-0">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">{product.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">{TYPE_LABELS[product.type]}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" aria-label="Editar producto" onClick={startEditing}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Eliminar producto"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <p className="font-mono text-3xl font-medium tracking-tight">{formatCents(product.priceCents)}</p>
          </div>
        )}

        {product && editing && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <h2 className="mb-6 text-[15px] font-semibold">Editar producto</h2>
            <div className="mb-5">
              <LedgerLabel>NOMBRE</LedgerLabel>
              <LedgerInput value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="mb-5">
              <LedgerLabel>DESCRIPCIÓN</LedgerLabel>
              <LedgerInput value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
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
              <LedgerInput value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
            </div>
            <div className="flex gap-2">
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
        title="Eliminar producto"
        description="Se va a quitar del catálogo de forma permanente."
        confirmLabel="Eliminar"
        onConfirm={performDelete}
      />
    </>
  );
}
