'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ShoppingCart,
  Receipt,
  ClipboardList,
  Wrench,
  Package,
  Users,
  ChartNoAxesCombined,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Identidad "Folio": sin labels de sección en mayúsculas (el tell #1 de un
// sidebar genérico), sin logo-en-caja, sin bloque de highlight en el activo.
// La agrupación vive en el espacio en blanco entre clusters, no en texto.
interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  available: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, available: true },
  { href: '/dashboard/transactions', label: 'Transacciones', icon: ArrowLeftRight, available: false },
  { href: '/dashboard/purchases', label: 'Compras', icon: ShoppingCart, available: true },
  { href: '/dashboard/invoices', label: 'Facturas', icon: Receipt, available: true },
  { href: '/dashboard/budgets', label: 'Presupuestos', icon: ClipboardList, available: true },
  { href: '/dashboard/services', label: 'Servicios', icon: Wrench, available: true },
  { href: '/dashboard/products', label: 'Productos', icon: Package, available: true },
  { href: '/dashboard/users', label: 'Usuarios', icon: Users, available: true },
  { href: '/dashboard/reports', label: 'Reportes', icon: ChartNoAxesCombined, available: false },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings, available: false },
];

// Espacios donde cae una línea divisoria muy fina -- reemplaza los labels de
// sección en mayúsculas por separación puramente espacial.
const DIVIDER_AFTER = new Set(['/dashboard', '/dashboard/users']);

function FolioMark({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Glifo propio: tres barras ascendentes, sin cuadrado de fondo --
          nada de "logo-en-caja" genérico de starter kit. */}
      <svg width="20" height="18" viewBox="0 0 20 18" fill="none" aria-hidden>
        <rect x="0" y="11" width="4" height="7" rx="1" fill="var(--primary)" opacity="0.55" />
        <rect x="8" y="6" width="4" height="12" rx="1" fill="var(--primary)" opacity="0.8" />
        <rect x="16" y="0" width="4" height="18" rx="1" fill="var(--primary)" />
      </svg>
      {!collapsed && (
        <span className="text-[14.5px] font-semibold tracking-tight">FinanceApi</span>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen flex-col bg-card transition-[width] duration-200 ease-[var(--ease-in-out)]',
        collapsed ? 'w-[60px]' : 'w-[216px]',
      )}
      style={{ borderRight: '1px solid var(--border)' }}
    >
      <div className="flex h-14 items-center px-4">
        <FolioMark collapsed={collapsed} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pt-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          const row = (
            <div
              className={cn(
                'group relative flex items-center gap-3 rounded-md px-2.5 py-[7px] text-[13.5px] transition-colors duration-150 ease-[var(--ease-out)]',
                item.available
                  ? 'cursor-pointer text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                  : 'cursor-default text-muted-foreground/40',
              )}
            >
              {/* Indicador de activo: línea de 2px, no un bloque de fondo. */}
              {active && (
                <span className="absolute -left-3 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-primary" />
              )}
              <Icon
                size={16}
                strokeWidth={active ? 2.1 : 1.6}
                className={cn(
                  'shrink-0 transition-colors duration-150',
                  active && 'text-primary',
                )}
              />
              {!collapsed && (
                <span className={cn('truncate', active && 'font-medium text-foreground')}>
                  {item.label}
                </span>
              )}
              {!collapsed && !item.available && (
                <span className="ml-auto text-[10px] tracking-wide text-muted-foreground/50">
                  pronto
                </span>
              )}
            </div>
          );

          return (
            <div key={item.href} className="mb-0.5">
              {item.available ? (
                <Link href={item.href}>{row}</Link>
              ) : (
                <div aria-disabled title="Todavía no disponible">
                  {row}
                </div>
              )}
              {DIVIDER_AFTER.has(item.href) && (
                <div className="my-3 h-px" style={{ background: 'var(--border)' }} />
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-3">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center gap-3 rounded-md px-2.5 py-[7px] text-[13px] text-muted-foreground/60 transition-colors duration-150 hover:bg-secondary/70 hover:text-muted-foreground"
        >
          {collapsed ? <PanelLeftOpen size={16} strokeWidth={1.6} /> : <PanelLeftClose size={16} strokeWidth={1.6} />}
          {!collapsed && <span>Contraer</span>}
        </button>
      </div>
    </aside>
  );
}
