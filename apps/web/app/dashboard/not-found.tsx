import Link from 'next/link';
import { EmptyState } from '@/components/empty-state';

// Cubre una URL sin match dentro de /dashboard/* (ej. un id de sección mal
// tipeado). Al vivir en este nivel, dashboard/layout.tsx sigue mostrando el
// sidebar -- el usuario no pierde la navegación.
export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <EmptyState
        title="Página no encontrada"
        description="Esta sección no existe o la dirección está mal escrita."
        action={
          <Link href="/dashboard" className="font-mono text-xs text-primary border-b border-primary pb-px">
            Volver a la Cabina →
          </Link>
        }
      />
    </div>
  );
}
