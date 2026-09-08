import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AllExceptionsFilter } from './all-exceptions.filter';

function createHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ url: '/api/v1/products/1' }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('mock', {
    code,
    clientVersion: '5.22.0',
  });
}

describe('AllExceptionsFilter', () => {
  const logger = { error: jest.fn() } as any;

  it('mapea P2025 (no encontrado) a 404', () => {
    const filter = new AllExceptionsFilter(logger);
    const { host, status, json } = createHost();

    filter.catch(prismaError('P2025'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'NotFound' }),
    );
  });

  it('mapea P2002 (unique constraint) a 409', () => {
    const filter = new AllExceptionsFilter(logger);
    const { host, status, json } = createHost();

    filter.catch(prismaError('P2002'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Conflict' }),
    );
  });

  it('mapea P2003 (FK restrict, ej. borrar un producto en uso) a 409 con mensaje claro', () => {
    const filter = new AllExceptionsFilter(logger);
    const { host, status, json } = createHost();

    filter.catch(prismaError('P2003'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Conflict',
        message: 'No se puede eliminar: el recurso está en uso',
      }),
    );
  });

  it('un HttpException conocido conserva su status y mensaje', () => {
    const filter = new AllExceptionsFilter(logger);
    const { host, status, json } = createHost();

    filter.catch(new BadRequestException('dato inválido'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'dato inválido' }),
    );
  });

  it('cualquier otro error cae a 500 genérico y se loguea, sin filtrar detalles internos', () => {
    const filter = new AllExceptionsFilter(logger);
    const { host, status, json } = createHost();

    filter.catch(new Error('detalle interno sensible'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Ocurrió un error inesperado' }),
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
