'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Cuerpo compartido de los dos error.tsx (raíz y /dashboard) -- mismo
// vocabulario visual que EmptyState (línea fina, título, descripción muted),
// no un ilustración/ícono nuevo. El tinte destructive en la línea es la única
// diferencia a propósito: distingue "no hay nada acá" (EmptyState, neutro)
// de "algo se rompió" (esto).
export function ErrorState({
  title,
  description,
  onRetry,
  homeHref,
  homeLabel,
}: {
  title: string;
  description: string;
  onRetry: () => void;
  homeHref: string;
  homeLabel: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mx-auto mb-[18px] h-px w-8 bg-destructive/50" />
      <p className="text-[13.5px] font-medium">{title}</p>
      <p className="mt-0.5 mb-5 max-w-sm text-[13px] text-muted-foreground">{description}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
        <Button asChild size="sm">
          <Link href={homeHref}>{homeLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
