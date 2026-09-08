import Link from 'next/link';
import { EmptyState } from '@/components/empty-state';

// Cubre cualquier URL que no matchee ninguna ruta de la app (fuera de
// /dashboard/*, que tiene su propio not-found.tsx para conservar el
// sidebar). Reutiliza EmptyState tal cual -- mismo componente que ya usan
// las 7 listas de dominio para "sin datos todavía", nada nuevo.
export default function RootNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <EmptyState
        title="Página no encontrada"
        description="La dirección a la que intentaste entrar no existe o se movió."
        action={
          <Link href="/" className="font-mono text-xs text-primary border-b border-primary pb-px">
            Volver al inicio →
          </Link>
        }
      />
    </div>
  );
}
