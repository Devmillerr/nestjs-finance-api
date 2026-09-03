import { SetMetadata } from '@nestjs/common';

export const OWNERSHIP_KEY = 'ownership';

export interface OwnershipMetadata {
  // Nombre del delegate de Prisma, ej. 'user', 'purchase', 'budget'.
  model: string;
  // Campo en ese modelo que contiene el id del dueño (ej. 'clientId', o 'id'
  // para el caso de auto-propiedad como el perfil de usuario).
  ownerField: string;
  // Nombre del route param que trae el id del recurso (default: 'id').
  idParam?: string;
}

export const OwnedResource = (meta: OwnershipMetadata) =>
  SetMetadata(OWNERSHIP_KEY, meta);
