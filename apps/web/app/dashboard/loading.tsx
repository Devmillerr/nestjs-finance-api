import { DetailSkeleton } from '@/components/detail-skeleton';

// Solo aparece en la transición de navegación del lado del cliente, mientras
// Next carga el chunk de una ruta de /dashboard/* que todavía no tiene
// prefetch (ej. justo después de loguearse) -- las páginas ya manejan su
// propio estado de carga de datos con sus propios skeletons (TableRowsSkeleton
// en las listas, DetailSkeleton en los detalles) una vez montadas. No hay
// forma de saber acá si el destino es una lista o un detalle, así que se
// reutiliza el mismo DetailSkeleton ya construido en vez de inventar un
// tercer patrón de carga genérico.
export default function DashboardLoading() {
  return (
    <div className="p-7">
      <DetailSkeleton cards={2} />
    </div>
  );
}
