import { X } from 'lucide-react';

export function PermissionChip({
  label,
  onRemove,
  removing,
}: {
  label: string;
  /** Sin esto, el chip es solo de lectura (viewer sin permiso para revocar). */
  onRemove?: () => void;
  removing?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          aria-label={`Quitar permiso ${label}`}
          className="text-secondary-foreground/50 transition-colors hover:text-destructive disabled:opacity-40"
        >
          <X size={12} strokeWidth={2} />
        </button>
      )}
    </span>
  );
}
