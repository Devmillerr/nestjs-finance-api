import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IdempotencyStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

// Cuánto puede quedar una Idempotency-Key en PENDING antes de considerarse
// huérfana. El interceptor (idempotency.interceptor.ts) libera la reserva
// él mismo cuando el handler termina (éxito -> COMPLETED, error -> delete),
// pero si el proceso muere a mitad de request (crash, OOM kill, deploy que
// mata el pod) esa fila se queda en PENDING para siempre, y bloquearía
// CUALQUIER reintento legítimo con la misma key con un 409 "ya está en
// proceso" eterno. Este job la libera pasado un margen razonable.
const STALE_PENDING_MINUTES = 5;

@Injectable()
export class IdempotencyReaperTask {
  private readonly logger = new Logger(IdempotencyReaperTask.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async reapStalePendingKeys(): Promise<void> {
    const cutoff = new Date(Date.now() - STALE_PENDING_MINUTES * 60_000);

    const { count } = await this.prisma.idempotencyKey.deleteMany({
      where: {
        status: IdempotencyStatus.PENDING,
        createdAt: { lt: cutoff },
      },
    });

    if (count > 0) {
      this.logger.warn(
        `Liberadas ${count} Idempotency-Key(s) huérfanas en PENDING ` +
          `(>${STALE_PENDING_MINUTES}min) — probable crash a mitad de request.`,
      );
    }
  }
}
