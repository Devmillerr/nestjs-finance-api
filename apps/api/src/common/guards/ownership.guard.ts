import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OWNERSHIP_KEY,
  OwnershipMetadata,
} from '../decorators/owned-resource.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

// Este guard se agrega por-módulo (no globalmente, a diferencia de
// JwtAuthGuard/RolesGuard/PermissionsGuard), porque solo aplica a rutas que
// operan sobre UN recurso específico identificado por :id.
//
// Regla: ADMIN y OWNER pasan siempre. Cualquier otro rol solo pasa si
// `user[ownerField] === resourceId` para el modelo declarado en @OwnedResource().
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<OwnershipMetadata>(
      OWNERSHIP_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Sin @OwnedResource() en la ruta -> este guard no restringe nada.
    if (!meta) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    if (!user) return false;

    if (user.role === 'ADMIN' || user.role === 'OWNER') return true;

    const idParam = meta.idParam ?? 'id';
    const resourceId = request.params[idParam];

    const delegate = (this.prisma as any)[meta.model];
    if (!delegate) {
      throw new Error(
        `OwnershipGuard: el modelo Prisma "${meta.model}" no existe`,
      );
    }

    const resource = await delegate.findUnique({
      where: { id: resourceId },
      select: { [meta.ownerField]: true },
    });

    if (!resource) {
      throw new NotFoundException('Recurso no encontrado');
    }

    const ownerId = resource[meta.ownerField];
    if (ownerId !== user.userId) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a este recurso',
      );
    }

    return true;
  }
}
