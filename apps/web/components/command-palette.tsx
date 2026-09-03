'use client';

import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Receipt,
  ClipboardList,
  Wrench,
  Package,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useCommandPalette } from '@/components/providers/command-palette-provider';

const DESTINATIONS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/purchases', label: 'Compras', icon: ShoppingCart },
  { href: '/dashboard/invoices', label: 'Facturas', icon: Receipt },
  // Presupuestos: no está en las 9 secciones del sidebar nuevo, pero la
  // funcionalidad sigue existiendo -- se deja alcanzable acá para no
  // dejarla huérfana mientras se decide si vuelve al sidebar.
  { href: '/dashboard/budgets', label: 'Presupuestos', icon: ClipboardList },
  { href: '/dashboard/services', label: 'Servicios', icon: Wrench },
  { href: '/dashboard/products', label: 'Productos', icon: Package },
  { href: '/dashboard/users', label: 'Usuarios', icon: Users },
];

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

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
          {DESTINATIONS.map((d) => {
            const Icon = d.icon;
            return (
              <button
                key={d.href}
                onClick={() => go(d.href)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-secondary"
              >
                <Icon className="size-4 text-muted-foreground" />
                {d.label}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
