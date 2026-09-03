import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

const IDEMPOTENCY_HEADER = 'idempotency-key';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    const key = request.headers[IDEMPOTENCY_HEADER] as string | undefined;

    // El header es opcional: sin él, el endpoint se comporta como siempre
    // (sin garantía de idempotencia). Es responsabilidad del cliente pedirla.
    if (!key) {
      return next.handle();
    }

    const user = request.user as AuthenticatedUser;
    const route = `${request.method} ${request.route?.path ?? request.url}`;
    const requestHash = createHash('sha256')
      .update(JSON.stringify(request.body ?? {}))
      .digest('hex');

    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { userId_key_route: { userId: user.userId, key, route } },
    });

    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new ConflictException(
          'Esta Idempotency-Key ya se usó con un payload distinto',
        );
      }
      // Reintento legítimo: devolvemos la respuesta guardada, nunca
      // volvemos a ejecutar la creación.
      return of(existing.responseBody);
    }

    return next.handle().pipe(
      tap((responseBody: unknown) => {
        // No bloqueamos la respuesta al cliente si falla el guardado del
        // registro de idempotencia; solo significa que un reintento futuro
        // no estará protegido, no que la operación actual haya fallado.
        void this.prisma.idempotencyKey
          .create({
            data: {
              userId: user.userId,
              key,
              route,
              requestHash,
              statusCode: context.switchToHttp().getResponse().statusCode,
              responseBody: responseBody as object,
            },
          })
          .catch(() => undefined);
      }),
    );
  }
}
