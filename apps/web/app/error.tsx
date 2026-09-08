'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/error-state';

// Boundary de error a nivel raíz: cubre '/', '/login' y '/register'. Sigue
// renderizando dentro de app/layout.tsx (tema, fuentes, Toaster no se
// pierden), solo reemplaza el contenido de la página que falló.
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Nunca se muestra error.message en la UI (puede traer detalle interno
    // del componente que falló) -- solo va a la consola, para debugging.
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Ocurrió un error inesperado"
      description="Algo falló al mostrar esta página. Podés intentar de nuevo o volver al inicio."
      onRetry={reset}
      homeHref="/"
      homeLabel="Volver al inicio"
    />
  );
}
