import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, mergeMap, tap } from 'rxjs/operators';
import { createHash } from 'crypto';
import { IdempotencyStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

const IDEMPOTENCY_HEADER = 'idempotency-key';

interface StoredKey {
  requestHash: string;
  status: IdempotencyStatus;
  responseBody: unknown;
}

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
    const where = { userId_key_route: { userId: user.userId, key, route } };

    const existing = await this.prisma.idempotencyKey.findUnique({ where });
    if (existing) {
      return this.replayOrConflict(existing, requestHash);
    }

    // Reserva la key ANTES de ejecutar el handler. El UNIQUE(userId, key,
    // route) actúa como lock: si dos requests idénticas llegan a la vez,
    // el INSERT solo lo gana una -- la otra recibe P2002 en vez de que
    // ambas ejecuten la operación de negocio (el bug que esto reemplaza:
    // antes el registro se creaba recién DESPUÉS de correr el handler).
    try {
      await this.prisma.idempotencyKey.create({
        data: {
          userId: user.userId,
          key,
          route,
          requestHash,
          status: IdempotencyStatus.PENDING,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        // Perdimos la carrera: otra request reservó la key entre nuestro
        // findUnique y este create. Releemos para decidir 409 vs replay.
        const race = await this.prisma.idempotencyKey.findUnique({ where });
        if (race) {
          return this.replayOrConflict(race, requestHash);
        }
      }
      throw err;
    }

    return next.handle().pipe(
      tap((responseBody: unknown) => {
        // No bloqueamos la respuesta al cliente si falla el guardado; solo
        // significa que un reintento futuro no estará protegido, no que la
        // operación actual haya fallado.
        void this.prisma.idempotencyKey
          .update({
            where,
            data: {
              status: IdempotencyStatus.COMPLETED,
              statusCode: context.switchToHttp().getResponse().statusCode,
              responseBody: responseBody as object,
            },
          })
          .catch(() => undefined);
      }),
      catchError((err) =>
        // El handler falló (validación, 404, error de negocio, etc.): la
        // operación NO se completó, así que liberamos la reserva para que
        // un reintento legítimo con la misma key no quede bloqueado para
        // siempre con "ya está en proceso".
        from(
          this.prisma.idempotencyKey.delete({ where }).catch(() => undefined),
        ).pipe(mergeMap(() => throwError(() => err))),
      ),
    );
  }

  private replayOrConflict(
    existing: StoredKey,
    requestHash: string,
  ): Observable<unknown> {
    if (existing.requestHash !== requestHash) {
      throw new ConflictException(
        'Esta Idempotency-Key ya se usó con un payload distinto',
      );
    }
    if (existing.status === IdempotencyStatus.PENDING) {
      // Otra request con la misma key está en vuelo AHORA MISMO: no podemos
      // reintentar (duplicaría la escritura) ni devolver una respuesta
      // guardada (todavía no existe) -> 409 explícito, igual que Stripe con
      // "a request is currently being processed with this idempotency key".
      throw new ConflictException(
        'Esta operación ya está en proceso. Reintenta en unos segundos.',
      );
    }
    // Reintento legítimo: devolvemos la respuesta guardada, nunca volvemos
    // a ejecutar la creación.
    return of(existing.responseBody);
  }
}
