import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: SAFE_USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
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
}
