import { cn } from '@/lib/utils';

// Mapea los valores REALES de los enums del backend (PaymentStatus,
// ContractStatus) -- no una lista inventada aparte que pueda desincronizarse.
const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-success/10 text-success',
  ACTIVE: 'bg-success/10 text-success',
  PENDING: 'bg-warning/10 text-warning',
  NOT_COMPLETED: 'bg-warning/10 text-warning',
  INACTIVE: 'bg-muted-foreground/10 text-muted-foreground',
  CANCELED: 'bg-destructive/10 text-destructive',
};

export const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Completado',
  ACTIVE: 'Activo',
  PENDING: 'Pendiente',
  NOT_COMPLETED: 'No completado',
  INACTIVE: 'Inactivo',
  CANCELED: 'Cancelado',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground',
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
