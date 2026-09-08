'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { Topbar } from '@/components/layout/topbar';
import { BackLink } from '@/components/back-link';
import { DetailSkeleton } from '@/components/detail-skeleton';
import { StatusBadge } from '@/components/status-badge';
import { StatusSelect } from '@/components/status-select';
import { Button } from '@/components/ui/button';
import { LedgerSelect } from '@/components/ui/ledger-field';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { formatCents, formatDate } from '@/lib/format';
import { ApiError, getErrorMessage } from '@/lib/api';
import { Trash2, UserPlus, X } from 'lucide-react';

interface Assignment {
  id: string;
  userId: string;
  user: { id: string; email: string };
}
interface ContractDetail {
  id: string;
  clientId: string;
  serviceId: string | null;
  name: string | null;
  description: string | null;
  notes: string | null;
  priceCents: number | null;
  status: string;
  startDate: string;
  endDate: string | null;
  assignments: Assignment[];
}
interface Client {
  id: string;
  email: string;
}

const STATUS_OPTIONS = ['PENDING', 'ACTIVE', 'COMPLETED', 'INACTIVE', 'CANCELED'];

export default function ServiceContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { authFetch } = useAuth();
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [users, setUsers] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const load = () => {
    authFetch(`/service-contracts/${id}`)
      .then((data) => setContract(data as ContractDetail))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setError('Este contrato no existe o no tenés acceso a él.');
        } else if (err instanceof ApiError && err.status === 403) {
          setError('No tenés permiso para ver este contrato.');
        } else {
          setError(getErrorMessage(err, 'Error al cargar el contrato'));
        }
      });
  };

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Igual que en la creación: listar usuarios para asignar es ADMIN/OWNER-only.
    authFetch('/users?limit=100')
      .then((data) => setUsers((data as { data: Client[] }).data))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function changeStatus(status: string) {
    setUpdating(true);
    try {
      await authFetch(`/service-contracts/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast.success('Estado actualizado');
      load();
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudo actualizar el estado');
      setError(message);
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  }

  async function performDelete() {
    try {
      await authFetch(`/service-contracts/${id}`, { method: 'DELETE' });
      toast.success('Contrato eliminado');
      router.push('/dashboard/service-contracts');
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudo eliminar el contrato');
      setError(message);
      toast.error(message);
    }
  }

  async function addAssignment() {
    if (!newAssigneeId) return;
    setAssigning(true);
    try {
      await authFetch(`/service-contracts/${id}/assignments`, {
        method: 'POST',
        body: JSON.stringify({ userId: newAssigneeId }),
      });
      setNewAssigneeId('');
      toast.success('Persona asignada');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'No se pudo asignar'));
    } finally {
      setAssigning(false);
    }
  }

  async function removeAssignment(assignmentId: string) {
    try {
      await authFetch(`/service-contracts/${id}/assignments/${assignmentId}`, { method: 'DELETE' });
      toast.success('Asignación quitada');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'No se pudo quitar la asignación'));
    }
  }

  const assignedIds = new Set(contract?.assignments.map((a) => a.userId));
  const assignableUsers = users.filter((u) => !assignedIds.has(u.id));

  return (
    <>
      <Topbar title="Detalle de contrato" />

      <div className="p-7">
        <BackLink />

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {!error && !contract && <DetailSkeleton cards={2} />}

        {contract && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-y-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    Desde {formatDate(contract.startDate)}
                    {contract.endDate ? ` · hasta ${formatDate(contract.endDate)}` : ''}
                  </p>
                  <p className="mt-1 text-lg font-medium">{contract.name ?? 'Contrato de servicio'}</p>
                  {contract.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{contract.description}</p>
                  )}
                  {contract.priceCents !== null && (
                    <p className="mt-2 font-mono text-2xl font-medium tracking-tight">
                      {formatCents(contract.priceCents)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={contract.status} />
                  {/* Solo ADMIN/OWNER pueden borrar (RolesGuard en el backend).
                      Se muestra siempre; el backend responde 403 si no corresponde. */}
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Eliminar contrato"
                    onClick={() => setConfirmOpen(true)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3 border-t border-border pt-5">
                <span className="text-sm text-muted-foreground">Estado</span>
                <StatusSelect
                  value={contract.status}
                  options={STATUS_OPTIONS}
                  disabled={updating}
                  onChange={changeStatus}
                />
              </div>

              {contract.notes && (
                <div className="mt-5 border-t border-border pt-5">
                  <p className="text-xs text-muted-foreground">Notas</p>
                  <p className="mt-1 text-sm">{contract.notes}</p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card shadow-xs">
              <div className="border-b border-border px-6 py-4">
                <p className="text-sm font-semibold">Equipo asignado</p>
                <p className="text-xs text-muted-foreground">
                  Personas que trabajan este contrato. Asignar/quitar es exclusivo de ADMIN/OWNER.
                </p>
              </div>

              {contract.assignments.length === 0 ? (
                <EmptyState title="Sin nadie asignado" description="Todavía no asignaste a nadie a este contrato." />
              ) : (
                <ul>
                  {contract.assignments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between border-b border-border px-6 py-3 last:border-0"
                    >
                      <span className="text-sm">{a.user.email}</span>
                      <button
                        onClick={() => removeAssignment(a.id)}
                        className="text-muted-foreground/50 transition-colors hover:text-destructive"
                        title="Quitar asignación"
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-col gap-2 border-t border-border p-4 sm:flex-row sm:items-center">
                {/* flex-col + sm:flex-row (no flex-1 en el select): con flex-1 en
                    flex-wrap, el <select> se angosta junto al botón en vez de
                    pasar a su propia línea, y el texto queda cortado a 375px. */}
                <LedgerSelect
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  className="sm:w-auto"
                >
                  <option value="">Seleccioná una persona…</option>
                  {assignableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email}
                    </option>
                  ))}
                </LedgerSelect>
                <Button size="sm" disabled={!newAssigneeId || assigning} onClick={addAssignment}>
                  <UserPlus className="size-4" />
                  Asignar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar contrato"
        description="Esta acción no se puede deshacer. El contrato y sus asignaciones se van a borrar de forma permanente."
        onConfirm={performDelete}
      />
    </>
  );
}
