export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('es-PE', {
    style: 'currency',
    currency: 'USD',
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
