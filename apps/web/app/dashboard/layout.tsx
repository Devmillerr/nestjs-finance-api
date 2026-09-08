'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Sidebar } from '@/components/layout/sidebar';
import { CommandPalette } from '@/components/command-palette';
import { MobileNav } from '@/components/mobile-nav';
import { MobileNavProvider } from '@/components/providers/mobile-nav-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando sesión…</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    // Se está redirigiendo (efecto de arriba) -- no renderizar contenido
    // protegido ni un instante de más.
    return null;
  }

  return (
    <MobileNavProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        {/* El sidebar ahora es una superficie flotante con su propio margen, así
            que el contenido lleva el padding simétrico en lugar de arrancar
            pegado a un divisor. */}
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden p-3.5">{children}</div>
        <CommandPalette />
        <MobileNav />
      </div>
    </MobileNavProvider>
  );
}
