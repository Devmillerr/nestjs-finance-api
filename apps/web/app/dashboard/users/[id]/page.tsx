'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { Topbar } from '@/components/layout/topbar';
import { BackLink } from '@/components/back-link';
import { DetailSkeleton } from '@/components/detail-skeleton';
import { Button } from '@/components/ui/button';
import { LedgerLabel, LedgerInput, LedgerSelect } from '@/components/ui/ledger-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoleBadge, ROLE_LABELS } from '@/components/role-badge';
import { PermissionChip } from '@/components/permission-chip';
import { formatDate } from '@/lib/format';
import { ApiError, getErrorMessage } from '@/lib/api';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { Role } from '@/lib/nav';
import { ALL_PERMISSIONS, PERMISSION_LABELS, type AllPermissionName } from '@/lib/permissions';
import { Pencil, UserX, Plus } from 'lucide-react';

const ROLE_OPTIONS: Role[] = ['USER', 'TEAM', 'ADMIN', 'OWNER'];

interface UserDetail {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  permissions: AllPermissionName[];
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
  const { authFetch, user, viewer } = useAuth();
  const [profile, setProfile] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [updatingRole, setUpdatingRole] = useState(false);
  const [grantSelection, setGrantSelection] = useState('');
  const [granting, setGranting] = useState(false);
  const [revokingPermission, setRevokingPermission] = useState<AllPermissionName | null>(null);

  // Presentación únicamente -- el backend revalida con RolesGuard/PermissionsGuard
  // en cada request, igual que el resto de los controles admin-only de esta app.
  const isSelf = profile?.id === user?.sub;
  const canChangeRole = viewer?.role === 'OWNER' && !isSelf;
  const canManagePermissions = viewer?.role === 'ADMIN' || viewer?.role === 'OWNER';
  const grantablePermissions = profile
    ? ALL_PERMISSIONS.filter((p) => !profile.permissions.includes(p))
    : [];

  const load = () => {
    authFetch(`/users/${id}`)
      .then((data) => setProfile(data as UserDetail))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          setError('No tenés permiso para ver este perfil.');
        } else if (err instanceof ApiError && err.status === 404) {
          setError('Este usuario no existe.');
        } else {
          setError(getErrorMessage(err, 'Error al cargar el usuario'));
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
      const message = getErrorMessage(err, 'No se pudo guardar el perfil');
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
      const message = getErrorMessage(err, 'No se pudo desactivar la cuenta');
      setError(message);
      toast.error(message);
    }
  }

  async function changeRole(role: Role) {
    setUpdatingRole(true);
    try {
      await authFetch(`/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      toast.success('Rol actualizado');
      load();
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudo actualizar el rol');
      setError(message);
      toast.error(message);
    } finally {
      setUpdatingRole(false);
    }
  }

  async function grantPermission() {
    if (!grantSelection) return;
    setGranting(true);
    try {
      await authFetch(`/users/${id}/permissions`, {
        method: 'POST',
        body: JSON.stringify({ permission: grantSelection }),
      });
      setGrantSelection('');
      toast.success('Permiso otorgado');
      load();
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudo otorgar el permiso');
      setError(message);
      toast.error(message);
    } finally {
      setGranting(false);
    }
  }

  async function revokePermission(permission: AllPermissionName) {
    setRevokingPermission(permission);
    try {
      await authFetch(`/users/${id}/permissions/${permission}`, { method: 'DELETE' });
      toast.success('Permiso revocado');
      load();
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudo revocar el permiso');
      setError(message);
      toast.error(message);
    } finally {
      setRevokingPermission(null);
    }
  }

  return (
    <>
      <Topbar title="Perfil de usuario" />

      <div className="max-w-lg p-7">
        <BackLink />

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {!error && !profile && <DetailSkeleton />}

        {profile && !editing && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-y-2">
              <div className="min-w-0">
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
                <Button variant="outline" size="icon" aria-label="Editar perfil" onClick={startEditing}>
                  <Pencil className="size-4" />
                </Button>
                {profile.isActive && (
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Desactivar cuenta"
                    onClick={() => setConfirmOpen(true)}
                  >
                    <UserX className="size-4" />
                  </Button>
                )}
              </div>
            </div>

            {profile.details && (
              <div className="grid grid-cols-1 gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
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

        {profile && (
          <div className="mt-4 rounded-xl border border-border bg-card shadow-xs">
            <div className="border-b border-border px-6 py-4">
              <p className="text-sm font-semibold">Rol y permisos</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-4">
              <span className="text-sm text-muted-foreground">Rol</span>
              {canChangeRole ? (
                <Select
                  value={profile.role}
                  onValueChange={(value) => changeRole(value as Role)}
                  disabled={updatingRole}
                >
                  <SelectTrigger>
                    <SelectValue>
                      <RoleBadge role={profile.role} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <RoleBadge role={profile.role} />
              )}
              {isSelf && (
                <span className="text-xs text-muted-foreground/60">
                  No podés cambiar tu propio rol.
                </span>
              )}
            </div>

            <div className="px-6 py-4">
              <p className="text-sm text-muted-foreground">
                Permisos adicionales otorgados a este usuario, más allá de lo que ya cubre su rol.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {profile.permissions.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60">
                    Sin permisos adicionales — usa los del rol.
                  </p>
                ) : (
                  profile.permissions.map((p) => (
                    <PermissionChip
                      key={p}
                      label={PERMISSION_LABELS[p] ?? p}
                      removing={revokingPermission === p}
                      onRemove={canManagePermissions ? () => revokePermission(p) : undefined}
                    />
                  ))
                )}
              </div>

              {canManagePermissions && (
                <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center">
                  <LedgerSelect
                    value={grantSelection}
                    onChange={(e) => setGrantSelection(e.target.value)}
                    className="sm:w-auto"
                  >
                    <option value="">Seleccioná un permiso…</option>
                    {grantablePermissions.map((p) => (
                      <option key={p} value={p}>
                        {PERMISSION_LABELS[p]}
                      </option>
                    ))}
                  </LedgerSelect>
                  <Button size="sm" disabled={!grantSelection || granting} onClick={grantPermission}>
                    <Plus className="size-4" />
                    Otorgar
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {profile && editing && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <h2 className="mb-6 text-[15px] font-semibold">Editar perfil</h2>
            <div className="mb-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
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
