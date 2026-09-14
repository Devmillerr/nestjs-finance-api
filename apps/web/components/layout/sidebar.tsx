'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navGroupsFor, isNavItemActive, type NavItem } from '@/lib/nav';
import { useAuth } from '@/components/providers/auth-provider';

// El sidebar comparte el fondo de la página y se separa solo con un borde
// derecho (dirección "Premium Dark"). El estado activo es una marca de 2px
// con glow más un tinte que se desvanece hacia la derecha, nunca un bloque
// de fondo sólido.
//
// La lista de secciones no vive acá: viene de lib/nav.ts, compartida con la
// command palette.

export function BrandMark({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-[26px] items-center gap-2.5 px-1.5">
      {/* Glifo propio: tres barras ascendentes, sin cuadrado de fondo. */}
      <svg width="15" height="14" viewBox="0 0 20 18" fill="none" className="shrink-0" aria-hidden>
        <rect x="0" y="11" width="4" height="7" rx="1" fill="var(--primary)" opacity="0.5" />
        <rect x="8" y="6" width="4" height="12" rx="1" fill="var(--primary)" opacity="0.75" />
        <rect x="16" y="0" width="4" height="18" rx="1" fill="var(--primary)" />
      </svg>
      {!collapsed && (
        <span className="truncate text-[14px] font-semibold tracking-tight">FinanceApi</span>
      )}
    </div>
  );
}

export function initialsFromEmail(email: string | undefined): string {
  if (!email) return '?';
  return email.split('@')[0].slice(0, 2).toUpperCase();
}

/**
 * Contadores por sección. El sidebar no consulta datos: los recibe. Se
 * llenan cuando existan los endpoints de agregados (PR 3); hasta entonces
 * no se pinta ningún número — un contador inventado es peor que ninguno.
 */
export interface SidebarCounts {
  invoicesOverdue?: number;
  purchasesOpen?: number;
  budgetsOpen?: number;
}

function NavRow({
  item,
  active,
  collapsed,
  count,
  onNavigate,
  onExpand,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  count?: number;
  /** El drawer mobile lo usa para cerrarse al elegir un destino; el sidebar
   * desktop no lo necesita (no hay nada que cerrar). */
  onNavigate?: () => void;
  /** Solo lo dispara "Resumen" (item.href === '/dashboard'): con el sidebar
   * colapsado, es el único punto de entrada para reabrirlo -- el botón
   * dedicado del borde únicamente cierra. */
  onExpand?: () => void;
}) {
  const Icon = item.icon;
  const isHome = item.href === '/dashboard';

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      onClick={() => {
        onNavigate?.();
        if (isHome && collapsed) onExpand?.();
      }}
      className={cn(
        'relative flex items-center gap-[11px] rounded-[10px] py-2 text-[13px]',
        'transition-[background-color,color,transform] duration-200 ease-[var(--ease-out)] hover:scale-[1.02]',
        collapsed ? 'justify-center px-0' : 'px-2.5',
        active
          ? 'font-medium text-foreground'
          : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
      )}
      style={
        active
          ? {
              background:
                'linear-gradient(90deg, var(--accent), color-mix(in oklab, var(--accent) 25%, transparent))',
              boxShadow: 'inset 0 0 0 1px var(--accent-edge)',
            }
          : undefined
      }
    >
      {/* Indicador de activo: marca de 2px con glow, no un bloque. */}
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-[18px] w-[2px] -translate-y-1/2 rounded-r-sm bg-primary"
          style={{ boxShadow: '0 0 10px 0 var(--primary)' }}
        />
      )}
      <Icon
        size={15}
        strokeWidth={active ? 1.9 : 1.6}
        className={cn('shrink-0', active && 'text-primary')}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && count !== undefined && count > 0 && (
        <span
          className={cn(
            'tabular ml-auto text-[10.5px]',
            item.badgeTone === 'warning' ? 'text-destructive' : 'text-muted-foreground/70',
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

/**
 * Groups + NavRow: la misma pieza que ya renderizaba el `<aside>` desktop,
 * extraída para que el drawer mobile (components/mobile-nav.tsx) la reuse
 * tal cual -- ningún lugar además de lib/nav.ts define qué secciones existen
 * o quién puede verlas.
 */
export function SidebarNavGroups({
  groups,
  pathname,
  collapsed,
  counts,
  onNavigate,
  onExpand,
}: {
  groups: ReturnType<typeof navGroupsFor>;
  pathname: string;
  collapsed: boolean;
  counts?: SidebarCounts;
  onNavigate?: () => void;
  onExpand?: () => void;
}) {
  return (
    // min-h-0: sin esto, un flex item con flex-1 no encoge por debajo de su
    // contenido, así que con muchas secciones el pie del sidebar terminaba
    // empujado fuera de pantalla en vez de dejar que solo el nav scrollee.
    <nav className="mt-4 flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto">
      {groups.map((group, gi) => (
        <div key={group.heading ?? `group-${gi}`} className="flex flex-col gap-0.5">
          {group.heading && !collapsed && (
            <p className="mx-2.5 mb-1.5 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {group.heading}
            </p>
          )}
          {group.items.map((item) => (
            <NavRow
              key={item.href}
              item={item}
              active={isNavItemActive(item, pathname)}
              collapsed={collapsed}
              count={item.badgeKey ? counts?.[item.badgeKey] : undefined}
              onNavigate={onNavigate}
              onExpand={onExpand}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ counts }: { counts?: SidebarCounts }) {
  const pathname = usePathname();
  const { user, viewer, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const groups = navGroupsFor(viewer);

  return (
    <aside
      className={cn(
        // Oculto debajo de `lg`: en tablet/mobile la navegación la da el
        // drawer (mobile-nav.tsx), no una versión encogida de este sidebar.
        //
        // sticky + h-screen: el body es lo que scrollea en pantallas largas
        // (no hay contenedor de scroll propio por página), así que sin
        // sticky el sidebar se iría con el resto del contenido.
        'sticky top-0 hidden h-screen flex-col justify-between border-r border-border bg-background lg:flex',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[66px]' : 'w-[214px]',
      )}
    >
      {/* Botón central sobre el borde derecho: SOLO cierra. Para reabrir con
          el sidebar colapsado, el único punto de entrada es hacer click en
          "Resumen" (ver isHome en NavRow) -- no hay botón de apertura. */}
      {!collapsed && (
        <button
          onClick={() => setCollapsed(true)}
          title="Contraer"
          aria-label="Contraer navegación"
          className="absolute top-1/2 right-0 z-10 flex size-6 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-[0_1px_3px_rgb(0_0_0_/_0.4)] transition-[background-color,color,transform] duration-200 ease-[var(--ease-out)] hover:scale-110 hover:bg-surface-2 hover:text-foreground"
        >
          <ChevronLeft size={14} strokeWidth={2} />
        </button>
      )}

      {/* Bloque superior: logo, y la navegación con SU PROPIO scroll (min-h-0
          en SidebarNavGroups) -- nunca el bloque inferior. */}
      <div className="flex min-h-0 flex-1 flex-col px-3.5">
        <div className="flex shrink-0 items-center pt-4">
          <BrandMark collapsed={collapsed} />
        </div>

        <SidebarNavGroups
          groups={groups}
          pathname={pathname}
          collapsed={collapsed}
          counts={counts}
          onExpand={() => setCollapsed(false)}
        />
      </div>

      {/* Bloque inferior: fijo, nunca se recorta. shrink-0 lo saca del cálculo
          de flex-1 de arriba; el padding propio (no heredado) evita que se
          vea aplastado contra el borde. El logout es su propia fila de ancho
          completo (mismo tratamiento que un NavRow, con su propio hover) --
          no un link chico debajo del correo. */}
      <div className="shrink-0 border-t border-border px-3.5 pt-3.5 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-[30px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
          >
            {initialsFromEmail(user?.email)}
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-snug">
              <p className="truncate text-[12px] text-foreground">{user?.email ?? '—'}</p>
              <p className="truncate text-[11px] text-muted-foreground">FinanceApi · v1.0.0</p>
            </div>
          )}
        </div>
        <button
          onClick={() => void logout()}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className={cn(
            'mt-2 flex w-full items-center gap-[11px] rounded-[10px] py-2 text-[13px] text-muted-foreground',
            'transition-colors duration-200 hover:bg-surface-2 hover:text-foreground',
            collapsed ? 'justify-center px-0' : 'px-2.5',
          )}
        >
          <LogOut size={15} strokeWidth={1.6} className="shrink-0" />
          {!collapsed && <span className="truncate">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
