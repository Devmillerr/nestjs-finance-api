'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { Topbar } from '@/components/layout/topbar';
import { BackLink } from '@/components/back-link';
import { DetailSkeleton } from '@/components/detail-skeleton';
import { Button } from '@/components/ui/button';
import { LedgerLabel, LedgerInput } from '@/components/ui/ledger-field';
import { formatCents } from '@/lib/format';
import { ApiError, getErrorMessage } from '@/lib/api';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Pencil, Trash2 } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  photoUrl: string;
}

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { authFetch } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const load = () => {
    authFetch(`/services/${id}`)
      .then((data) => setService(data as Service))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setError('Este servicio no existe.');
        } else {
          setError(getErrorMessage(err, 'Error al cargar el servicio'));
        }
      });
  };

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  function startEditing() {
    if (!service) return;
    setName(service.name);
    setDescription(service.description);
    setPrice(String(service.priceCents / 100));
    setPhotoUrl(service.photoUrl);
    setEditing(true);
  }

  async function saveEdits() {
    setSaving(true);
    try {
      await authFetch(`/services/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          description,
          priceCents: Math.round(Number(price) * 100),
          photoUrl,
        }),
      });
      setEditing(false);
      toast.success('Servicio actualizado');
      load();
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudo guardar el servicio');
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function performDelete() {
    try {
      await authFetch(`/services/${id}`, { method: 'DELETE' });
      toast.success('Servicio eliminado');
      router.push('/dashboard/services');
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudo eliminar el servicio');
      setError(message);
      toast.error(message);
    }
  }

  return (
    <>
      <Topbar title="Detalle de servicio" />

      <div className="max-w-lg p-7">
        <BackLink />

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {!error && !service && <DetailSkeleton />}

        {service && !editing && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-y-2">
              <div className="min-w-0">
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
              {/* Mutaciones son ADMIN/OWNER-only en el backend (RolesGuard) --
                  se muestra siempre, el backend responde 403 si no corresponde. */}
              <div className="flex gap-2">
                <Button variant="outline" size="icon" aria-label="Editar servicio" onClick={startEditing}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Eliminar servicio"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <p className="font-mono text-3xl font-medium tracking-tight">
              {formatCents(service.priceCents)}
            </p>
          </div>
        )}

        {service && editing && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <h2 className="mb-6 text-[15px] font-semibold">Editar servicio</h2>
            <div className="mb-5">
              <LedgerLabel>NOMBRE</LedgerLabel>
              <LedgerInput value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="mb-5">
              <LedgerLabel>DESCRIPCIÓN</LedgerLabel>
              <LedgerInput value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="mb-6">
              <LedgerLabel>PRECIO</LedgerLabel>
              <LedgerInput
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="font-mono"
              />
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
        title="Eliminar servicio"
        description="Se va a quitar del catálogo de forma permanente."
        confirmLabel="Eliminar"
        onConfirm={performDelete}
      />
    </>
  );
}
