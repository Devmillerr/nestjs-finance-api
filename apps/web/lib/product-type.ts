// Mapea los valores REALES del enum ProductType del backend
// (apps/api/prisma/schema.prisma) -- no una lista inventada aparte.
export const PRODUCT_TYPES = ['WEB', 'FIVEM', 'DISCORD_BOT'] as const;

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  WEB: 'Web',
  FIVEM: 'FiveM',
  DISCORD_BOT: 'Bot de Discord',
};
