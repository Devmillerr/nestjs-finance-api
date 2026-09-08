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

interface Client {
  id: string;
  email: string;
}
interface Service {
  id: string;
  name: string;
  priceCents: number;
}

export default function NewServiceContractPage() {
  const { authFetch } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clientId, setClientId] = useState('');
  const [mode, setMode] = useState<'catalog' | 'custom'>('catalog');
  const [serviceId, setServiceId] = useState('');
  const [name, setName] = useState('');
  const [priceCents, setPriceCents] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // GET /users y la creación de contratos son ambas ADMIN/OWNER-only en el
    // backend -- si un USER llega a esta página igual, esta llamada le va a
    // devolver 403, consistente con el resto de las pantallas restringidas.
    authFetch('/users?limit=100')
      .then((data) => setClients((data as { data: Client[] }).data))
      .catch((err) => setError(getErrorMessage(err, 'Error al cargar clientes')));
    authFetch('/services?limit=100')
      .then((data) => setServices((data as { data: Service[] }).data))
      .catch((err) => setError(getErrorMessage(err, 'Error al cargar servicios')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit() {
    setError(null);
    if (!clientId) {
      setError('Seleccioná un cliente.');
      return;
    }
    if (!startDate) {
      setError('Indicá una fecha de inicio.');
      return;
    }
    if (mode === 'catalog' && !serviceId) {
      setError('Seleccioná un servicio del catálogo.');
      return;
    }
    if (mode === 'custom' && !name.trim()) {
      setError('Ingresá un nombre para el contrato personalizado.');
      return;
    }

    setSubmitting(true);
    try {
      const contract = (await authFetch('/service-contracts', {
        method: 'POST',
        body: JSON.stringify({
          clientId,
          serviceId: mode === 'catalog' ? serviceId : undefined,
          name: name.trim() || undefined,
          priceCents: priceCents ? Math.round(Number(priceCents) * 100) : undefined,
          description: description.trim() || undefined,
          notes: notes.trim() || undefined,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
        }),
      })) as { id: string };
      toast.success('Contrato creado');
      router.push(`/dashboard/service-contracts/${contract.id}`);
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudo crear el contrato');
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Topbar title="Nuevo contrato" />

      <div className="max-w-2xl p-7">
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <h2 className="mb-6 text-[15px] font-semibold">Nuevo contrato</h2>

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
              <LedgerLabel>FECHA DE INICIO</LedgerLabel>
              <LedgerInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>

          <div className="mb-2 border-t border-border pt-4">
            <div className="mb-2.5 flex gap-4">
              <button
                type="button"
                onClick={() => setMode('catalog')}
                className={`text-[12px] font-mono tracking-wide transition-colors ${mode === 'catalog' ? 'text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground'}`}
              >
                DEL CATÁLOGO
              </button>
              <button
                type="button"
                onClick={() => setMode('custom')}
                className={`text-[12px] font-mono tracking-wide transition-colors ${mode === 'custom' ? 'text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground'}`}
              >
                PERSONALIZADO
              </button>
            </div>

            {mode === 'catalog' ? (
              <LedgerSelect value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                <option value="">Seleccioná un servicio…</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {formatCents(s.priceCents)}
                  </option>
                ))}
              </LedgerSelect>
            ) : (
              <div className="flex gap-4">
                <LedgerInput
                  placeholder="Nombre del contrato"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1"
                />
                <LedgerInput
                  type="number"
                  step="0.01"
                  placeholder="Precio"
                  className="w-28 text-right font-mono"
                  value={priceCents}
                  onChange={(e) => setPriceCents(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="mb-6 mt-4">
            <LedgerLabel>DESCRIPCIÓN (OPCIONAL)</LedgerLabel>
            <LedgerInput value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <LedgerLabel>NOTAS (OPCIONAL)</LedgerLabel>
              <LedgerInput value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div>
              <LedgerLabel>FECHA DE FIN (OPCIONAL)</LedgerLabel>
              <LedgerInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {error && (
            <p className="mt-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button className="mt-5 w-full" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Creando…' : 'Crear contrato'}
          </Button>
        </div>
      </div>
    </>
  );
}
