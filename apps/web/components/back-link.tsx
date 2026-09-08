'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

// Antes este bloque estaba copy-pasteado, idéntico byte a byte, en las 7
// páginas de detalle (budgets, invoices, products, purchases,
// service-contracts, services, users). Un solo componente, mismo
// comportamiento (router.back()) y mismo estilo que ya tenían todas.
export function BackLink() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Volver
    </button>
  );
}
