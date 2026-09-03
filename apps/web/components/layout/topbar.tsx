'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useCommandPalette } from '@/components/providers/command-palette-provider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, LogOut } from 'lucide-react';

function initialsFromEmail(email: string | undefined): string {
  if (!email) return '?';
  const name = email.split('@')[0];
  return name.slice(0, 2).toUpperCase();
}

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user, logout } = useAuth();
  const { setOpen } = useCommandPalette();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-5 bg-card px-7" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="mr-auto">
        <h1 className="text-[15px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-[12px] text-muted-foreground">{subtitle}</p>}
      </div>

      {/* Buscador como trigger subrayado, no un pill de fondo -- mismo
          lenguaje que las decisiones de "Folio" en el sidebar: la jerarquía
          la da el tipo y el espacio, no cajas. */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border-b border-transparent pb-0.5 text-[13px] text-muted-foreground/70 transition-colors duration-150 hover:border-border hover:text-muted-foreground"
      >
        <Search size={14} strokeWidth={1.6} />
        <span>Buscar</span>
        <kbd className="ml-1 font-mono text-[10px] text-muted-foreground/50">⌘K</kbd>
      </button>

      <div className="flex items-center gap-3">
        <Avatar className="size-7">
          <AvatarFallback className="text-[10.5px]">{initialsFromEmail(user?.email)}</AvatarFallback>
        </Avatar>
        <button
          onClick={() => void logout()}
          title="Cerrar sesión"
          className="text-muted-foreground/50 transition-colors duration-150 hover:text-foreground"
        >
          <LogOut size={15} strokeWidth={1.6} />
        </button>
      </div>
    </header>
  );
}
