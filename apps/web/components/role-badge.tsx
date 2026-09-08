import { cn } from '@/lib/utils';
import type { Role } from '@/lib/nav';

// Dominio propio (roles), separado de STATUS_STYLES en status-badge.tsx que
// mapea estados de pedido/contrato -- mezclarlos haría que un color
// significara cosas distintas según el contexto.
const ROLE_STYLES: Record<Role, string> = {
  USER: 'bg-muted text-muted-foreground',
  TEAM: 'bg-secondary text-secondary-foreground',
  ADMIN: 'bg-warning-bg text-warning',
  OWNER: 'bg-success-bg text-success',
};

export const ROLE_LABELS: Record<Role, string> = {
  USER: 'Usuario',
  TEAM: 'Equipo',
  ADMIN: 'Admin',
  OWNER: 'Owner',
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        ROLE_STYLES[role] ?? 'bg-muted text-muted-foreground',
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}
