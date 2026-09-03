import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

// Aplicado globalmente en app.module.ts (APP_GUARD). Esto es intencional:
// en V2, el bug crítico #1 era que TODOS los endpoints eran públicos porque
// nadie protegía las rutas por defecto. Acá invertimos la regla: todo está
// protegido salvo que el endpoint se marque explícitamente como @Public()
// (login, register, refresh, health check).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
