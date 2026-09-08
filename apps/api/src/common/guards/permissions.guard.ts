import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionName } from '@prisma/client';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionName[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const user = context.switchToHttp().getRequest().user as
      AuthenticatedUser | undefined;

    if (!user) return false;

    // ADMIN/OWNER pasan por rol sin necesitar el permiso explícito asignado.
    if (user.role === 'ADMIN' || user.role === 'OWNER') return true;

    // ALL_PERMISSION es un comodín (equivale a tener todos los permisos).
    // El frontend ya asume esta semántica en apps/web/lib/nav.ts (canSee());
    // esto la hace real también del lado del backend, que es quien manda.
    if (user.permissions.includes(PermissionName.ALL_PERMISSION)) return true;

    return requiredPermissions.every((perm) => user.permissions.includes(perm));
  }
}
