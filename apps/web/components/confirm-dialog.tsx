'use client';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Eliminar',
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Sin animate-in de zoom (heredado del Dialog base) -- acá sí vale
          un fade corto porque es una acción ocasional/destructiva, no una
          de teclado frecuente como el Cmd+K. */}
      <DialogContent className="max-w-[320px] p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-150">
        <p className="mb-2.5 font-mono text-[10px] tracking-wide text-destructive">
          ACCIÓN IRREVERSIBLE
        </p>
        <DialogTitle className="mb-2 text-[15px]">{title}</DialogTitle>
        <DialogDescription className="mb-5 leading-relaxed">{description}</DialogDescription>
        <div className="flex gap-2 border-t border-border pt-4">
          <button
            onClick={() => onOpenChange(false)}
            className="h-9 flex-1 rounded-md border border-input text-[13px] transition-colors duration-150 hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="h-9 flex-1 rounded-md bg-destructive text-[13px] text-destructive-foreground transition-transform duration-100 ease-[var(--ease-out)] active:scale-[0.97]"
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
