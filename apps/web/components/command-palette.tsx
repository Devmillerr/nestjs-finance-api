'use client';

import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useCommandPalette } from '@/components/providers/command-palette-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { NAV_GROUPS, navGroupsFor } from '@/lib/nav';

// La lista de destinos ya no vive acá: viene de lib/nav.ts, la misma que
// consume el sidebar. Antes eran dos arrays independientes y habían
// divergido (esta tenía un comentario diciendo que Presupuestos no estaba en
// el sidebar, cuando sí estaba). Ahora la palette agrupa igual que la nav.

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const { viewer } = useAuth();
  const router = useRouter();

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  const groups = navGroupsFor(viewer);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false}>
        <div className="border-b border-border px-4 py-3">
          <DialogTitle>Ir a…</DialogTitle>
          <DialogDescription className="sr-only">
            Navegación rápida entre secciones de FinanceApi
          </DialogDescription>
        </div>
        <div className="p-2">
          {groups.map((group, gi) => (
            <div key={group.heading ?? `group-${gi}`}>
              {group.heading && (
                <p className="mx-3 mb-1 mt-2 text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground/70">
                  {group.heading}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    onClick={() => go(item.href)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-surface-2"
                  >
                    <Icon className="size-4 text-muted-foreground" strokeWidth={1.7} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Re-export para tests o consumidores que antes importaban la lista.
export { NAV_GROUPS };
