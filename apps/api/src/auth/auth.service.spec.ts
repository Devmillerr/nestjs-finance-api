import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// Mock manual de PrismaService: solo los métodos que AuthService realmente
// usa. Evita levantar una base de datos real para probar lógica de negocio
// pura (reglas de auth), que es justamente lo que un test unitario debe
// aislar.
function createPrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  } as unknown as PrismaService;
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let jwt: { sign: jest.Mock };
  let config: { get: jest.Mock; getOrThrow: jest.Mock };

  beforeEach(() => {
    prisma = createPrismaMock();
    jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') };
    config = {
      getOrThrow: jest.fn().mockReturnValue('test-secret'),
      get: jest.fn((_key: string, fallback?: unknown) => fallback ?? 'test'),
    };

    service = new AuthService(
      prisma,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  describe('register', () => {
    it('rechaza un email ya registrado', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user',
      });

      await expect(
        service.register({
          email: 'taken@example.com',
          password: 'password123',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toThrow(ConflictException);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('crea el usuario con el password hasheado, nunca en texto plano', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockImplementation(({ data }) =>
        Promise.resolve({ id: 'new-user', email: data.email, role: 'USER' }),
      );

      const result = await service.register({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'A',
        lastName: 'B',
      });

      expect(result).toEqual({
        id: 'new-user',
        email: 'new@example.com',
        role: 'USER',
      });

      const createCall = (prisma.user.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.passwordHash).not.toBe('password123');
      expect(createCall.data.passwordHash.length).toBeGreaterThan(20);
    });
  });

  describe('login', () => {
    it('rechaza con mensaje genérico si el email no existe (evita user enumeration)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ email: 'nope@example.com', password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rechaza si el usuario está inactivo', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        isActive: false,
        passwordHash: 'irrelevant',
      });

      await expect(
        service.login({ email: 'inactive@example.com', password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh — rotación y detección de reuso', () => {
    it('rechaza un token que no existe', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.refresh('token-inexistente')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rechaza un token revocado o expirado', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt1',
        userId: 'u1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 100_000),
        replacedByTokenHash: null,
      });

      await expect(service.refresh('some-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('detecta reuso de un token ya rotado y revoca TODAS las sesiones del usuario', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt1',
        userId: 'u1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 100_000),
        replacedByTokenHash: 'already-rotated-hash', // <- la señal de reuso
      });

      await expect(service.refresh('stolen-and-reused-token')).rejects.toThrow(
        UnauthorizedException,
      );

      // La revocación masiva es el comportamiento crítico a probar: no basta
      // con rechazar el request, hay que cerrar todas las sesiones activas.
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('en un refresh legítimo, marca el token viejo como reemplazado (no lo borra)', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt1',
        userId: 'u1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 100_000),
        replacedByTokenHash: null,
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
        isActive: true,
      });
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});
      (prisma.refreshToken.update as jest.Mock).mockResolvedValue({});

      const result = await service.refresh('valid-token');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rt1' } }),
      );
      // Nunca se borra el registro viejo -> queda como evidencia de auditoría
      // de la cadena de rotación.
    });

    it('dos refreshes concurrentes del mismo usuario firman refresh tokens con jti distinto (nunca colisionan)', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt1',
        userId: 'u1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 100_000),
        replacedByTokenHash: null,
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
        isActive: true,
      });
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});
      (prisma.refreshToken.update as jest.Mock).mockResolvedValue({});

      await service.refresh('valid-token');
      await service.refresh('valid-token');

      const refreshTokenCalls = jwt.sign.mock.calls.filter(
        ([payload]) => 'jti' in payload,
      );
      expect(refreshTokenCalls).toHaveLength(2);
      const [firstJti, secondJti] = refreshTokenCalls.map(
        ([payload]) => payload.jti,
      );
      expect(firstJti).toEqual(expect.any(String));
      expect(firstJti).not.toBe(secondJti);
    });
  });
});
