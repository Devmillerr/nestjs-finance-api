import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OwnershipGuard } from './ownership.guard';
import { PrismaService } from '../../prisma/prisma.service';

function createContext(
  user: unknown,
  params: Record<string, string> = { id: 'res-1' },
) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user, params }),
    }),
  } as unknown as ExecutionContext;
}

function createGuard(
  meta: unknown,
  prismaModels: Record<string, { findUnique: jest.Mock }>,
) {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(meta) };
  const prisma = prismaModels as unknown as PrismaService;
  return new OwnershipGuard(reflector as unknown as Reflector, prisma);
}

describe('OwnershipGuard', () => {
  it('sin @OwnedResource() en la ruta, no restringe nada', async () => {
    const guard = createGuard(undefined, {});
    await expect(
      guard.canActivate(createContext({ userId: 'u1', role: 'USER' })),
    ).resolves.toBe(true);
  });

  it('sin usuario autenticado en el request, rechaza', async () => {
    const guard = createGuard({ model: 'invoice', ownerField: 'clientId' }, {});
    await expect(guard.canActivate(createContext(undefined))).resolves.toBe(
      false,
    );
  });

  it('ADMIN pasa siempre, sin consultar la base', async () => {
    const findUnique = jest.fn();
    const guard = createGuard(
      { model: 'invoice', ownerField: 'clientId' },
      {
        invoice: { findUnique },
      },
    );

    await expect(
      guard.canActivate(createContext({ userId: 'admin-1', role: 'ADMIN' })),
    ).resolves.toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('OWNER pasa siempre, sin consultar la base', async () => {
    const findUnique = jest.fn();
    const guard = createGuard(
      { model: 'invoice', ownerField: 'clientId' },
      {
        invoice: { findUnique },
      },
    );

    await expect(
      guard.canActivate(createContext({ userId: 'owner-1', role: 'OWNER' })),
    ).resolves.toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('404 si el recurso no existe', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const guard = createGuard(
      { model: 'invoice', ownerField: 'clientId' },
      {
        invoice: { findUnique },
      },
    );

    await expect(
      guard.canActivate(createContext({ userId: 'u1', role: 'USER' })),
    ).rejects.toThrow(NotFoundException);
  });

  it('rechaza (403) si el usuario no es el dueño del recurso', async () => {
    const findUnique = jest
      .fn()
      .mockResolvedValue({ clientId: 'otro-usuario' });
    const guard = createGuard(
      { model: 'invoice', ownerField: 'clientId' },
      {
        invoice: { findUnique },
      },
    );

    await expect(
      guard.canActivate(createContext({ userId: 'u1', role: 'USER' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('permite el acceso si el usuario es el dueño del recurso', async () => {
    const findUnique = jest.fn().mockResolvedValue({ clientId: 'u1' });
    const guard = createGuard(
      { model: 'invoice', ownerField: 'clientId' },
      {
        invoice: { findUnique },
      },
    );

    await expect(
      guard.canActivate(createContext({ userId: 'u1', role: 'USER' })),
    ).resolves.toBe(true);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'res-1' },
      select: { clientId: true },
    });
  });

  it('usa el idParam declarado en @OwnedResource() en vez de "id" por defecto', async () => {
    const findUnique = jest.fn().mockResolvedValue({ id: 'u1' });
    const guard = createGuard(
      { model: 'user', ownerField: 'id', idParam: 'userId' },
      { user: { findUnique } },
    );

    await expect(
      guard.canActivate(
        createContext(
          { userId: 'u1', role: 'USER' },
          { userId: 'u1', id: 'otra-cosa' },
        ),
      ),
    ).resolves.toBe(true);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'u1' },
      select: { id: true },
    });
  });

  it('lanza un error explícito si @OwnedResource() declara un modelo Prisma inexistente', async () => {
    const guard = createGuard(
      { model: 'noExiste', ownerField: 'clientId' },
      {},
    );

    await expect(
      guard.canActivate(createContext({ userId: 'u1', role: 'USER' })),
    ).rejects.toThrow('OwnershipGuard: el modelo Prisma "noExiste" no existe');
  });
});
