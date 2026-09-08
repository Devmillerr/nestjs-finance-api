import { Skeleton } from '@/components/ui/skeleton';

// Reemplaza el "Cargando…" de texto plano que tenían las 7 páginas de
// detalle (a diferencia de las listas, que ya usaban TableRowsSkeleton).
// Reutiliza el mismo chroma de tarjeta que ya usa el contenido real de esas
// páginas (rounded-xl border border-border bg-card p-6 shadow-xs + un
// separador border-t) -- no es un patrón nuevo, es ese mismo contenedor con
// líneas de Skeleton adentro en vez de datos.
function DetailSkeletonCard({ rows }: { rows: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-44" />
        </div>
        <Skeleton className="size-9 shrink-0 rounded-md" />
      </div>
      <div className="mt-5 space-y-3 border-t border-border pt-5">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * `cards` refleja cuántas tarjetas apiladas tiene la página real una vez
 * cargada (invoices: 3 -- header, líneas, cargos; purchases/service-contracts:
 * 2; budgets/products/services/users: 1), para que el esqueleto ocupe un
 * espacio parecido al contenido final y no haya un salto de layout grande.
 */
export function DetailSkeleton({ cards = 1 }: { cards?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <DetailSkeletonCard key={i} rows={i === 0 ? 3 : 2} />
      ))}
    </div>
  );
}
