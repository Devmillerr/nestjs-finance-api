import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import type { IncomingMessage } from 'http';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { IdempotencyReaperTask } from './common/tasks/idempotency-reaper.task';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { PurchasesModule } from './purchases/purchases.module';
import { BudgetsModule } from './budgets/budgets.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ServicesModule } from './services/services.module';
import { ServiceContractsModule } from './service-contracts/service-contracts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Logging estructurado con pino. Reemplaza el logger default de Nest
    // (que solo imprime texto plano sin poder correlacionar líneas de un
    // mismo request, y sin poder redactar secretos automáticamente).
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get<string>('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            level: isProd ? 'info' : 'debug',
            // pino-pretty en desarrollo (legible en consola); JSON crudo en
            // producción (lo que espera cualquier agregador de logs real:
            // CloudWatch, Datadog, Supabase logs, etc.)
            transport: isProd
              ? undefined
              : { target: 'pino-pretty', options: { singleLine: true } },
            // Correlación: todo log de un mismo request comparte requestId,
            // así se puede reconstruir el flujo completo de una petición
            // filtrando por ese campo.
            genReqId: (req: IncomingMessage & { id?: string }) =>
              req.id ?? randomUUID(),
            // Nunca loguear secretos ni contraseñas, ni siquiera por
            // accidente en un log de debug.
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.password',
                'req.body.passwordHash',
                'req.body.refreshToken',
                'res.headers["set-cookie"]',
              ],
              censor: '[REDACTED]',
            },
          },
        };
      },
    }),
    // Rate limit global por defecto; endpoints sensibles (login) lo
    // sobreescriben con @Throttle() a un límite más estricto.
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    // Habilita @Cron()/@Interval() en toda la app (usado por
    // IdempotencyReaperTask para liberar keys PENDING huérfanas).
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    PurchasesModule,
    BudgetsModule,
    InvoicesModule,
    ServicesModule,
    ServiceContractsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    IdempotencyReaperTask,
    // Orden importa: primero rate limit, luego autenticación, luego
    // autorización por rol/permiso. Todo global -> "seguro por defecto",
    // los endpoints públicos se marcan explícitamente con @Public().
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    // Filtro global: todo error de la API responde con el mismo shape,
    // sin importar de dónde venga (Nest, Prisma, o un throw genérico).
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
