'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/error-state';

// Boundary de error a nivel /dashboard: cubre las 8 secciones de dominio.
// Al estar en este nivel (no en la raíz), dashboard/layout.tsx sigue
// renderizando alrededor -- el usuario no pierde el sidebar ni la navegación
// cuando una pantalla puntual falla.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Ocurrió un error inesperado"
      description="Algo falló al mostrar esta sección. Podés intentar de nuevo o volver a la Cabina."
      onRetry={reset}
      homeHref="/dashboard"
      homeLabel="Volver a la Cabina"
    />
  );
}
