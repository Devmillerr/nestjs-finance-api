'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { Topbar } from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { LedgerLabel, LedgerInput } from '@/components/ui/ledger-field';
import { formatDate } from '@/lib/format';
import { ApiError } from '@/lib/api';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ArrowLeft, Pencil, UserX } from 'lucide-react';

interface UserDetail {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  details: {
    firstName: string;
    lastName: string;
    nickname: string | null;
    address: string | null;
    zipCode: string | null;
    phone: string | null;
  } | null;
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { authFetch } = useAuth();
  const [profile, setProfile] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const load = () => {
    authFetch(`/users/${id}`)
      .then((data) => setProfile(data as UserDetail))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          setError('No tenés permiso para ver este perfil.');
        } else if (err instanceof ApiError && err.status === 404) {
          setError('Este usuario no existe.');
        } else {
          setError(err instanceof Error ? err.message : 'Error al cargar el usuario');
        }
      });
  };

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  function startEditing() {
    if (!profile) return;
    setFirstName(profile.details?.firstName ?? '');
    setLastName(profile.details?.lastName ?? '');
    setPhone(profile.details?.phone ?? '');
    setAddress(profile.details?.address ?? '');
    setEditing(true);
  }

  async function saveEdits() {
    setSaving(true);
    try {
      await authFetch(`/users/${id}/details`, {
        method: 'PATCH',
        body: JSON.stringify({ firstName, lastName, phone, address }),
      });
      setEditing(false);
      toast.success('Perfil actualizado');
      load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar el perfil';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function performDeactivate() {
    try {
      await authFetch(`/users/${id}/deactivate`, { method: 'PATCH' });
      toast.success('Cuenta desactivada');
      load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo desactivar la cuenta';
      setError(message);
      toast.error(message);
    }
  }

  return (
    <>
      <Topbar title="Perfil de usuario" />

      <div className="max-w-lg p-7">
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

        {!error && !profile && <p className="text-sm text-muted-foreground">Cargando…</p>}

        {profile && !editing && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="font-medium">
                  {profile.details
                    ? `${profile.details.firstName} ${profile.details.lastName}`
                    : profile.email}
                </p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {profile.role} · {profile.isActive ? 'Activo' : 'Desactivado'} · desde{' '}
                  {formatDate(profile.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                {/* Editar perfil: dueño o ADMIN/OWNER (OwnershipGuard con
                    auto-propiedad). Desactivar: ADMIN/OWNER-only (RolesGuard).
                    Ambos se muestran siempre; el backend responde 403 si no
                    corresponde. */}
                <Button variant="outline" size="icon" onClick={startEditing}>
                  <Pencil className="size-4" />
                </Button>
                {profile.isActive && (
                  <Button variant="outline" size="icon" onClick={() => setConfirmOpen(true)}>
                    <UserX className="size-4" />
                  </Button>
                )}
              </div>
            </div>

            {profile.details && (
              <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <p>{profile.details.phone ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dirección</p>
                  <p>{profile.details.address ?? '—'}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {profile && editing && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <h2 className="mb-6 text-[15px] font-semibold">Editar perfil</h2>
            <div className="mb-5 grid grid-cols-2 gap-6">
              <div>
                <LedgerLabel>NOMBRE</LedgerLabel>
                <LedgerInput value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <LedgerLabel>APELLIDO</LedgerLabel>
                <LedgerInput value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="mb-5">
              <LedgerLabel>TELÉFONO</LedgerLabel>
              <LedgerInput value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="mb-6">
              <LedgerLabel>DIRECCIÓN</LedgerLabel>
              <LedgerInput value={address} onChange={(e) => setAddress(e.target.value)} />
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
        title="Desactivar cuenta"
        description="El usuario no va a poder iniciar sesión hasta que se reactive la cuenta."
        confirmLabel="Desactivar"
        onConfirm={performDeactivate}
      />
    </>
  );
}
