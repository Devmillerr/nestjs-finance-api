'use client';

import { usePathname } from 'next/navigation';
import { LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useMobileNav } from '@/components/providers/mobile-nav-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { navGroupsFor } from '@/lib/nav';
import { BrandMark, SidebarNavGroups, initialsFromEmail } from '@/components/layout/sidebar';

// Navegación para tablet/mobile, donde el <aside> desktop está oculto (ver
// hidden lg:flex en components/layout/sidebar.tsx). Reutiliza Dialog/
// DialogContent (Radix, ya instalado) con un override de posición -- en vez
// del modal centrado de siempre, ancla a la izquierda y ocupa el alto
// completo. El contenido de navegación en sí (grupos, ítems, gating por
// permiso, estado activo) es SidebarNavGroups, la misma pieza que usa el
// sidebar desktop -- lib/nav.ts sigue siendo la única fuente de secciones.
export function MobileNav() {
  const { open, setOpen } = useMobileNav();
  const pathname = usePathname();
  const { user, viewer, logout } = useAuth();

  const groups = navGroupsFor(viewer);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'top-0 left-0 h-full w-72 max-w-[85vw] translate-x-0 rounded-none rounded-r-xl p-0',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left duration-200',
        )}
      >
        <DialogTitle className="sr-only">Navegación</DialogTitle>
        <DialogDescription className="sr-only">
          Navegación principal de FinanceApi
        </DialogDescription>

        <div className="flex h-full flex-col p-4 px-3">
          <div className="flex items-center justify-between px-1.5">
            <BrandMark collapsed={false} />
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar navegación"
              className="flex size-[26px] items-center justify-center rounded-md text-muted-foreground/70 transition-colors duration-150 hover:bg-surface-2 hover:text-foreground"
            >
              <X size={15} strokeWidth={1.7} />
            </button>
          </div>

          <SidebarNavGroups
            groups={groups}
            pathname={pathname}
            collapsed={false}
            onNavigate={() => setOpen(false)}
          />

          <div className="mt-3 flex items-center gap-2.5 px-1.5">
            <div
              className="flex size-[26px] shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold"
              style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
            >
              {initialsFromEmail(user?.email)}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[11.5px]">{user?.email ?? '—'}</p>
              <button
                onClick={() => void logout()}
                className="flex items-center gap-1 text-[10px] text-muted-foreground/70 transition-colors duration-150 hover:text-foreground"
              >
                <LogOut size={10} strokeWidth={1.8} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
