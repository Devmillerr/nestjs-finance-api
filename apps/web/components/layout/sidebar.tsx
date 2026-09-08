'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navGroupsFor, isNavItemActive, type NavItem } from '@/lib/nav';
import { useAuth } from '@/components/providers/auth-provider';

// Dirección "Cabina" (2C): el sidebar es una superficie flotante sobre el
// fondo de la app, no una columna pegada al borde con un divisor. El estado
// activo es una marca de 2px con glow más un tinte que se desvanece hacia la
// derecha — nunca un bloque de fondo sólido.
//
// La lista de secciones ya no vive acá: viene de lib/nav.ts, compartida con
// la command palette.

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
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  count?: number;
  /** El drawer mobile lo usa para cerrarse al elegir un destino; el sidebar
   * desktop no lo necesita (no hay nada que cerrar). */
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
      className={cn(
        'relative flex items-center gap-2.5 rounded-lg py-2 text-[13px]',
        'transition-colors duration-150 ease-[var(--ease-out)]',
        collapsed ? 'justify-center px-0' : 'px-2.5',
        active
          ? 'font-medium text-foreground'
          : 'text-muted-foreground hover:bg-surface-2/70 hover:text-foreground',
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
}: {
  groups: ReturnType<typeof navGroupsFor>;
  pathname: string;
  collapsed: boolean;
  counts?: SidebarCounts;
  onNavigate?: () => void;
}) {
  return (
    <nav className="mt-5 flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto">
      {groups.map((group, gi) => (
        <div key={group.heading ?? `group-${gi}`} className="flex flex-col gap-0.5">
          {group.heading && !collapsed && (
            <p className="mx-2.5 mb-1.5 text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground/70">
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
        // Oculto por completo debajo de `lg`: en tablet/mobile la navegación
        // la da el drawer (components/mobile-nav.tsx), no una versión
        // encogida de este sidebar -- por eso es hidden, no un ancho menor.
        'sticky top-3.5 m-3.5 mr-0 hidden h-[calc(100vh-1.75rem)] flex-col rounded-xl bg-card p-4 px-3 lg:flex',
        'transition-[width] duration-200 ease-[var(--ease-in-out)]',
        collapsed ? 'w-[68px]' : 'w-[216px]',
      )}
      style={{ boxShadow: '0 0 0 1px var(--border), 0 10px 30px -18px rgb(0 0 0 / 0.35)' }}
    >
      <BrandMark collapsed={collapsed} />

      <SidebarNavGroups groups={groups} pathname={pathname} collapsed={collapsed} counts={counts} />

      <div className="mt-3 flex items-center gap-2.5 px-1.5">
        <div
          className="flex size-[26px] shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold"
          style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
        >
          {initialsFromEmail(user?.email)}
        </div>
        {!collapsed && (
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
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expandir' : 'Contraer'}
          aria-label={collapsed ? 'Expandir navegación' : 'Contraer navegación'}
          className={cn(
            'flex size-[22px] items-center justify-center rounded-md text-muted-foreground/70',
            'transition-colors duration-150 hover:bg-surface-2 hover:text-foreground',
            collapsed ? '' : 'ml-auto',
          )}
        >
          {collapsed ? (
            <PanelLeftOpen size={14} strokeWidth={1.6} />
          ) : (
            <PanelLeftClose size={14} strokeWidth={1.6} />
          )}
        </button>
      </div>
    </aside>
  );
}
