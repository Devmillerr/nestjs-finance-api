import * as React from 'react';
import { cn } from '@/lib/utils';

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  // Envuelve la tabla en su propio contenedor con scroll horizontal -- antes
  // las páginas ponían <Table> directo dentro de un contenedor con
  // overflow-hidden (pensado solo para recortar esquinas redondeadas), así
  // que una tabla más ancha que la pantalla no scrolleaba: recortaba
  // contenido de forma invisible. Con esto, si una tabla no entra, scrollea
  // sola dentro de su caja -- nunca la página completa. Cambio en un solo
  // lugar: las 8 páginas que ya usan <Table> lo heredan sin tocarlas.
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      className={cn('bg-secondary/50 [&_tr]:border-b [&_tr]:border-border', className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody className={className} {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      className={cn(
        'border-b border-border transition-colors last:border-0 hover:bg-secondary/60',
        className,
      )}
      {...props}
    />
  );
}

function TableHead({
  className,
  align = 'left',
  ...props
}: React.ComponentProps<'th'> & { align?: 'left' | 'right' }) {
  return (
    <th
      className={cn(
        'h-10 px-4 font-mono text-[11px] font-normal tracking-[0.08em] text-muted-foreground uppercase',
        align === 'left' ? 'text-left' : 'text-right',
        className,
      )}
      {...props}
    />
  );
}

function TableCell({
  className,
  align = 'left',
  ...props
}: React.ComponentProps<'td'> & { align?: 'left' | 'right' }) {
  return (
    <td
      className={cn('px-4 py-3 align-middle', align === 'left' ? 'text-left' : 'text-right', className)}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
