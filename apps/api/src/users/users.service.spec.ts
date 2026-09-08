import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

function createPrismaMock() {
  const user = {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
  };
  const permission = {
    findUnique: jest.fn(),
  };
  const userPermission = {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  };
  return {
    prisma: { user, permission, userPermission } as unknown as PrismaService,
    user,
    permission,
    userPermission,
  };
}

// findOne (llamado internamente para el chequeo de 404 en updateRole/
// grantPermission/revokePermission) ahora selecciona permissions también
// -- el mock tiene que devolver esa forma real de Prisma.
const EXISTING_USER = { id: 'user-1', email: 'x@y.com', permissions: [] };

describe('UsersService — roles y permisos', () => {
  describe('updateRole', () => {
    it('actualiza el rol y devuelve el usuario con sus permisos actuales', async () => {
      const { prisma, user } = createPrismaMock();
      user.findUnique.mockResolvedValue(EXISTING_USER);
      user.update.mockResolvedValue({
        id: 'user-1',
        role: 'ADMIN',
        permissions: [{ permission: { name: 'READ_USER' } }],
      });
      const service = new UsersService(prisma);

      const result = await service.updateRole('user-1', 'ADMIN');

      expect(user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { role: 'ADMIN' },
        }),
      );
      expect(result).toMatchObject({
        id: 'user-1',
        role: 'ADMIN',
        permissions: ['READ_USER'],
      });
    });

    it('404 si el usuario no existe', async () => {
      const { prisma, user } = createPrismaMock();
      user.findUnique.mockResolvedValue(null);
      const service = new UsersService(prisma);

      await expect(service.updateRole('nope', 'ADMIN')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('grantPermission', () => {
    it('otorga el permiso vía upsert (idempotente) y devuelve el usuario actualizado', async () => {
      const { prisma, user, permission, userPermission } = createPrismaMock();
      user.findUnique.mockResolvedValue(EXISTING_USER);
      permission.findUnique.mockResolvedValue({
        id: 'perm-1',
        name: 'READ_USER',
      });
      userPermission.upsert.mockResolvedValue(undefined);
      user.findUniqueOrThrow.mockResolvedValue({
        id: 'user-1',
        permissions: [{ permission: { name: 'READ_USER' } }],
      });
      const service = new UsersService(prisma);

      const result = await service.grantPermission('user-1', 'READ_USER');

      expect(userPermission.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_permissionId: { userId: 'user-1', permissionId: 'perm-1' },
          },
        }),
      );
      expect(result.permissions).toEqual(['READ_USER']);
    });

    it('404 si el permiso no existe en el catálogo (falta el seed)', async () => {
      const { prisma, user, permission } = createPrismaMock();
      user.findUnique.mockResolvedValue(EXISTING_USER);
      permission.findUnique.mockResolvedValue(null);
      const service = new UsersService(prisma);

      await expect(
        service.grantPermission('user-1', 'READ_USER'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('revokePermission', () => {
    it('elimina un permiso otorgado', async () => {
      const { prisma, user, permission, userPermission } = createPrismaMock();
      user.findUnique.mockResolvedValue(EXISTING_USER);
      permission.findUnique.mockResolvedValue({
        id: 'perm-1',
        name: 'READ_USER',
      });
      userPermission.findUnique.mockResolvedValue({ id: 'grant-1' });
      userPermission.delete.mockResolvedValue(undefined);
      user.findUniqueOrThrow.mockResolvedValue({
        id: 'user-1',
        permissions: [],
      });
      const service = new UsersService(prisma);

      const result = await service.revokePermission('user-1', 'READ_USER');

      expect(userPermission.delete).toHaveBeenCalledWith({
        where: { id: 'grant-1' },
      });
      expect(result.permissions).toEqual([]);
    });

    it('404 si el usuario no tiene ese permiso otorgado', async () => {
      const { prisma, user, permission, userPermission } = createPrismaMock();
      user.findUnique.mockResolvedValue(EXISTING_USER);
      permission.findUnique.mockResolvedValue({
        id: 'perm-1',
        name: 'READ_USER',
      });
      userPermission.findUnique.mockResolvedValue(null);
      const service = new UsersService(prisma);

      await expect(
        service.revokePermission('user-1', 'READ_USER'),
      ).rejects.toThrow(NotFoundException);
      expect(userPermission.delete).not.toHaveBeenCalled();
    });
  });
});
