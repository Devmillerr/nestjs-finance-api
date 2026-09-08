import { Injectable, NotFoundException } from '@nestjs/common';
import { PermissionName, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';
import { UpdateUserDetailsDto } from './dto/update-user-details.dto';

// Selección explícita: nunca devolver passwordHash en una respuesta, ni por
// accidente. En vez de confiar en recordarlo en cada método, se centraliza acá.
const SAFE_USER_SELECT = {
  id: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  details: {
    select: {
      firstName: true,
      lastName: true,
      nickname: true,
      address: true,
      zipCode: true,
      phone: true,
    },
  },
} as const;

// Igual que SAFE_USER_SELECT, más los nombres de permisos otorgados. Solo la
// usan las mutaciones de rol/permisos: el admin que acaba de otorgar/revocar
// algo necesita ver el resultado sin pegarle a /auth/me por separado.
const SAFE_USER_SELECT_WITH_PERMISSIONS = {
  ...SAFE_USER_SELECT,
  permissions: { select: { permission: { select: { name: true } } } },
} as const;

function toUserWithPermissions<
  T extends { permissions: { permission: { name: PermissionName } }[] },
>(user: T) {
  const { permissions, ...rest } = user;
  return { ...rest, permissions: permissions.map((p) => p.permission.name) };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        select: SAFE_USER_SELECT,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return paginate(data, total, query);
  }

  // Incluye permissions (no solo SAFE_USER_SELECT) para que la pantalla de
  // detalle pueda pintar "permisos actuales" en la carga inicial, sin
  // depender de que antes se haya disparado alguna mutación.
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: SAFE_USER_SELECT_WITH_PERMISSIONS,
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return toUserWithPermissions(user);
  }

  async updateDetails(userId: string, dto: UpdateUserDetailsDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        details: {
          upsert: {
            update: dto,
            create: {
              firstName: dto.firstName ?? '',
              lastName: dto.lastName ?? '',
              nickname: dto.nickname,
              address: dto.address,
              zipCode: dto.zipCode,
              phone: dto.phone,
            },
          },
        },
      },
      select: SAFE_USER_SELECT,
    });
  }

  // Soft: nunca hard-delete de un usuario. Tiene purchases/invoices/budgets
  // referenciándolo (FK con Restrict por default en Prisma) y borrarlo
  // rompería la integridad de esos registros financieros.
  async deactivate(id: string) {
    await this.findOne(id); // 404 si no existe
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: SAFE_USER_SELECT,
    });
  }

  // Restringido a OWNER en el controller: ADMIN no puede ascender a otro
  // usuario a ADMIN/OWNER (evita una cadena de escalamiento de privilegios).
  async updateRole(id: string, role: Role) {
    await this.findOne(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: SAFE_USER_SELECT_WITH_PERMISSIONS,
    });
    return toUserWithPermissions(user);
  }

  // Upsert sobre el @@unique([userId, permissionId]) -> otorgar un permiso ya
  // otorgado es un no-op idempotente, no un error.
  async grantPermission(id: string, permissionName: PermissionName) {
    await this.findOne(id);
    const permission = await this.findPermissionOrThrow(permissionName);

    await this.prisma.userPermission.upsert({
      where: {
        userId_permissionId: { userId: id, permissionId: permission.id },
      },
      update: {},
      create: { userId: id, permissionId: permission.id },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: SAFE_USER_SELECT_WITH_PERMISSIONS,
    });
    return toUserWithPermissions(user);
  }

  async revokePermission(id: string, permissionName: PermissionName) {
    await this.findOne(id);
    const permission = await this.findPermissionOrThrow(permissionName);

    const grant = await this.prisma.userPermission.findUnique({
      where: {
        userId_permissionId: { userId: id, permissionId: permission.id },
      },
    });
    if (!grant) {
      throw new NotFoundException(
        `El usuario no tiene otorgado el permiso "${permissionName}"`,
      );
    }

    await this.prisma.userPermission.delete({ where: { id: grant.id } });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: SAFE_USER_SELECT_WITH_PERMISSIONS,
    });
    return toUserWithPermissions(user);
  }

  // Permission es una tabla sembrada (prisma/seed.ts), no solo el enum: si
  // esto tira 404, lo más probable es que falte correr `npx prisma db seed`.
  private async findPermissionOrThrow(name: PermissionName) {
    const permission = await this.prisma.permission.findUnique({
      where: { name },
    });
    if (!permission) {
      throw new NotFoundException(
        `El permiso "${name}" no existe en el catálogo (¿falta correr el seed?)`,
      );
    }
    return permission;
  }
}
