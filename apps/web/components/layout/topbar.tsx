'use client';

import { usePathname } from 'next/navigation';
import { Search, Sun, Moon, Menu } from 'lucide-react';
import { useCommandPalette } from '@/components/providers/command-palette-provider';
import { useTheme } from '@/components/providers/theme-provider';
import { useMobileNav } from '@/components/providers/mobile-nav-provider';
import { navTitleFor } from '@/lib/nav';

// Dirección "Cabina" (2C): el topbar ya no es una barra con fondo y borde
// inferior — flota sobre el mismo fondo que el contenido, y la jerarquía la
// dan el tipo y el espacio.
//
// Dos cambios de comportamiento respecto a la versión anterior:
//
// 1. title/subtitle pasan a ser opcionales y por defecto se derivan de la
//    ruta (lib/nav.ts). Antes cada página pasaba su título acá Y además
//    renderizaba <PageHeader> con el mismo texto, así que "Compras" aparecía
//    dos veces, a 15px y a 20px (hallazgo #5 de la auditoría). Las páginas
//    ya no necesitan pasar nada; el <PageHeader> duplicado se puede borrar
//    en el PR de cada pantalla.
// 2. `actions` es el slot donde cada página monta sus controles propios (el
//    selector de periodo de la Cabina, "Nueva factura" en Facturas). El
//    topbar no los conoce.
//
// El avatar y el logout se mudaron al pie del sidebar, junto al email: son
// datos de sesión, no acciones de la pantalla.

export function Topbar({
  title,
  subtitle,
  actions,
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const { setOpen } = useCommandPalette();
  const { theme, toggleTheme } = useTheme();
  const { setOpen: setMobileNavOpen } = useMobileNav();

  const fromRoute = navTitleFor(pathname);
  const resolvedTitle = title ?? fromRoute.title;
  const resolvedSubtitle = subtitle ?? fromRoute.subtitle;

  return (
    <header className="flex min-h-[52px] shrink-0 flex-wrap items-center gap-3 px-1.5 py-1">
      {/* Solo visible debajo de `lg`, donde el sidebar (hidden lg:flex en
          sidebar.tsx) desaparece -- abre el mismo drawer que reemplaza la
          navegación en tablet/mobile. */}
      <button
        onClick={() => setMobileNavOpen(true)}
        aria-label="Abrir navegación"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card text-muted-foreground transition-colors duration-150 hover:text-foreground lg:hidden"
        style={{ boxShadow: 'inset 0 0 0 1px var(--border)' }}
      >
        <Menu size={16} strokeWidth={1.7} />
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-[17px] font-semibold tracking-tight">{resolvedTitle}</h1>
        {resolvedSubtitle && (
          <p className="truncate text-[11.5px] text-muted-foreground">{resolvedSubtitle}</p>
        )}
      </div>

      <div className="ml-auto flex flex-wrap items-center justify-end gap-2.5">
        {actions}

        <button
          onClick={() => setOpen(true)}
          aria-label="Buscar"
          className="flex items-center gap-2 rounded-lg bg-card px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
          style={{ boxShadow: 'inset 0 0 0 1px var(--border)' }}
        >
          <Search size={14} strokeWidth={1.6} />
          <span className="hidden sm:inline">Buscar</span>
          <kbd className="hidden font-mono text-[10px] text-muted-foreground/60 sm:inline">⌘K</kbd>
        </button>

        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          className="flex items-center gap-2 rounded-lg bg-card px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
          style={{ boxShadow: 'inset 0 0 0 1px var(--border)' }}
        >
          {theme === 'dark' ? (
            <Sun size={14} strokeWidth={1.7} />
          ) : (
            <Moon size={14} strokeWidth={1.7} />
          )}
          <span className="hidden sm:inline">{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
        </button>
      </div>
    </header>
  );
}
