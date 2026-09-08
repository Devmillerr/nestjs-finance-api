export function PageHeader({
  title,
  description,
  actions,
}: {
  // Opcional: el Topbar ya deriva su propio título de la ruta (lib/nav.ts),
  // así que las 7 listas de dominio que antes pasaban el mismo texto acá
  // (duplicado a dos tamaños en pantalla) ya no lo hacen. Sigue existiendo
  // para páginas que sí necesiten un título propio en el contenido.
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        {title && <h1 className="text-xl font-semibold tracking-tight">{title}</h1>}
        {description && (
          <p className={title ? 'mt-0.5 text-sm text-muted-foreground' : 'text-sm text-muted-foreground'}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
