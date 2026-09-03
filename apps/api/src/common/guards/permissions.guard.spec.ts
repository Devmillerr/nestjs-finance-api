import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';

function createContext(
  user: { role: string; permissions: string[] } | undefined,
): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  it('permite el acceso si el endpoint no requiere permisos', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    };
    const guard = new PermissionsGuard(reflector as unknown as Reflector);

    expect(
      guard.canActivate(createContext({ role: 'USER', permissions: [] })),
    ).toBe(true);
  });

  it('ADMIN pasa sin necesitar el permiso explícito asignado', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['DELETE_USER']),
    };
    const guard = new PermissionsGuard(reflector as unknown as Reflector);

    expect(
      guard.canActivate(createContext({ role: 'ADMIN', permissions: [] })),
    ).toBe(true);
  });

  it('un USER sin el permiso requerido es rechazado', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['DELETE_USER']),
    };
    const guard = new PermissionsGuard(reflector as unknown as Reflector);

    expect(
      guard.canActivate(
        createContext({ role: 'USER', permissions: ['READ_USER'] }),
      ),
    ).toBe(false);
  });

  it('un USER con el permiso exacto requerido es aceptado', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['READ_USER']),
    };
    const guard = new PermissionsGuard(reflector as unknown as Reflector);

    expect(
      guard.canActivate(
        createContext({ role: 'USER', permissions: ['READ_USER'] }),
      ),
    ).toBe(true);
  });

  it('requiere TODOS los permisos listados, no basta con uno solo', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValue(['READ_USER', 'DELETE_USER']),
    };
    const guard = new PermissionsGuard(reflector as unknown as Reflector);

    expect(
      guard.canActivate(
        createContext({ role: 'USER', permissions: ['READ_USER'] }),
      ),
    ).toBe(false);
  });
});
