'use client';

import { createContext, useContext, useState } from 'react';

// Mismo patrón que CommandPaletteProvider: contexto mínimo open/setOpen. El
// Topbar (instanciado en cada página, no en dashboard/layout.tsx) lo consume
// para mostrar el botón de hamburguesa sin que cada página tenga que
// pasarlo a mano.

interface MobileNavContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <MobileNavContext.Provider value={{ open, setOpen }}>{children}</MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext);
  if (!ctx) {
    throw new Error('useMobileNav debe usarse dentro de <MobileNavProvider>');
  }
  return ctx;
}
