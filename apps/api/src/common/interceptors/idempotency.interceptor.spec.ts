import {
  CallHandler,
  ConflictException,
  ExecutionContext,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { lastValueFrom, of, throwError } from 'rxjs';
import * as crypto from 'crypto';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { PrismaService } from '../../prisma/prisma.service';

function createPrismaMock() {
  const idempotencyKey = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  return {
    prisma: { idempotencyKey } as unknown as PrismaService,
    idempotencyKey,
  };
}

function createContext(
  handlerResult: unknown = { ok: true },
  statusCode = 201,
) {
  const request = {
    headers: { 'idempotency-key': 'key-1' },
    method: 'POST',
    route: { path: '/invoices' },
    url: '/invoices',
    body: { total: 100 },
    user: { userId: 'user-1' },
  };
  const response = { statusCode };
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
  const next: CallHandler = {
    handle: () =>
      handlerResult instanceof Error
        ? throwError(() => handlerResult)
        : of(handlerResult),
  };
  return { context, next, request };
}

const P2002 = new Prisma.PrismaClientKnownRequestError('unique constraint', {
  code: 'P2002',
  clientVersion: '5.22.0',
});

describe('IdempotencyInterceptor', () => {
  it('pasa directo cuando no hay header Idempotency-Key', async () => {
    const { prisma, idempotencyKey } = createPrismaMock();
    const interceptor = new IdempotencyInterceptor(prisma);
    const { context, next, request } = createContext();
    delete (request.headers as any)['idempotency-key'];

    const result = await lastValueFrom(
      await interceptor.intercept(context, next),
    );

    expect(result).toEqual({ ok: true });
    expect(idempotencyKey.findUnique).not.toHaveBeenCalled();
  });

  it('reserva la key (PENDING) antes de ejecutar el handler y la completa después', async () => {
    const { prisma, idempotencyKey } = createPrismaMock();
    idempotencyKey.findUnique.mockResolvedValue(null);
    idempotencyKey.create.mockResolvedValue(undefined);
    const interceptor = new IdempotencyInterceptor(prisma);
    const { context, next } = createContext({ ok: true }, 201);

    const result = await lastValueFrom(
      await interceptor.intercept(context, next),
    );

    expect(result).toEqual({ ok: true });
    expect(idempotencyKey.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PENDING' }),
      }),
    );
    expect(idempotencyKey.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'COMPLETED', statusCode: 201 }),
      }),
    );
  });

  it('reintento legítimo (misma key + mismo payload, COMPLETED) devuelve la respuesta guardada sin re-ejecutar', async () => {
    const { prisma, idempotencyKey } = createPrismaMock();
    const requestHash =
      '2d9e0e5c6a5d0f2e0f3a5c8e5e8f5e0e5e0f5e0e5e0f5e0e5e0f5e0e5e0f5e0e';
    idempotencyKey.findUnique.mockResolvedValue({
      requestHash,
      status: 'COMPLETED',
      responseBody: { stored: true },
    });
    const interceptor = new IdempotencyInterceptor(prisma);
    const { context, next } = createContext();
    // Forzar que el hash calculado coincida con el guardado.
    jest.spyOn(crypto, 'createHash').mockReturnValue({
      update: () => ({ digest: () => requestHash }),
    } as any);

    const result = await lastValueFrom(
      await interceptor.intercept(context, next),
    );

    expect(result).toEqual({ stored: true });
    expect(idempotencyKey.create).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  it('misma key con payload distinto responde 409 sin ejecutar el handler', async () => {
    const { prisma, idempotencyKey } = createPrismaMock();
    idempotencyKey.findUnique.mockResolvedValue({
      requestHash: 'otro-hash-distinto',
      status: 'COMPLETED',
      responseBody: { stored: true },
    });
    const interceptor = new IdempotencyInterceptor(prisma);
    const { context, next } = createContext();

    await expect(interceptor.intercept(context, next)).rejects.toThrow(
      ConflictException,
    );
    expect(idempotencyKey.create).not.toHaveBeenCalled();
  });

  it('dos requests concurrentes con la misma key: la que pierde el INSERT (P2002) recibe 409 "en proceso", no re-ejecuta', async () => {
    const { prisma, idempotencyKey } = createPrismaMock();
    idempotencyKey.findUnique
      .mockResolvedValueOnce(null) // primer chequeo: nadie la reservó todavía
      .mockResolvedValueOnce({
        requestHash: expect.any(String),
        status: 'PENDING',
        responseBody: null,
      });
    idempotencyKey.create.mockRejectedValue(P2002);
    const interceptor = new IdempotencyInterceptor(prisma);
    const { context, next } = createContext();

    await expect(interceptor.intercept(context, next)).rejects.toThrow(
      ConflictException,
    );
  });

  it('si el handler falla, libera la reserva (delete) para no bloquear un reintento legítimo', async () => {
    const { prisma, idempotencyKey } = createPrismaMock();
    idempotencyKey.findUnique.mockResolvedValue(null);
    idempotencyKey.create.mockResolvedValue(undefined);
    const interceptor = new IdempotencyInterceptor(prisma);
    const { context, next } = createContext(new Error('boom'));

    const observable = await interceptor.intercept(context, next);
    await expect(lastValueFrom(observable)).rejects.toThrow('boom');
    expect(idempotencyKey.delete).toHaveBeenCalled();
  });
});
