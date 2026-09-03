import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

// Todo error de la API responde con el mismo shape, sin importar de dónde
// venga (HttpException de Nest, error de Prisma, o un throw genérico).
// En V2 esto no existía: cada controller manejaba (o no manejaba) errores
// a su manera, y los rechazos de promesas en handlers async ni siquiera
// llegaban a un error handler.
interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(AllExceptionsFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, error, message } = this.resolve(exception);

    // Al loguear vía pino (no console.error suelto), esta línea queda
    // correlacionada por requestId con el resto de logs de la misma
    // petición -- se puede reconstruir el flujo completo filtrando por ese
    // campo en cualquier agregador de logs.
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error({ err: exception }, 'Unhandled exception');
    }

    const body: ErrorResponseBody = {
      statusCode,
      error,
      message,
      path: (request as any).url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }

  private resolve(exception: unknown): {
    statusCode: number;
    error: string;
    message: string | string[];
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const message =
        typeof payload === 'string'
          ? payload
          : ((payload as any).message ?? exception.message);
      return { statusCode: status, error: exception.name, message };
    }

    // Errores conocidos de Prisma -> los traducimos a algo entendible por
    // el cliente en vez de filtrar el detalle interno del ORM.
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'NotFound',
          message: 'Recurso no encontrado',
        };
      }
      if (exception.code === 'P2002') {
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: 'El recurso ya existe (violación de restricción única)',
        };
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message: 'Ocurrió un error inesperado',
    };
  }
}
