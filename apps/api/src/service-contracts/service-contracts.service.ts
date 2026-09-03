import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';
import { CreateServiceContractDto } from './dto/create-service-contract.dto';
import { UpdateServiceContractStatusDto } from './dto/update-service-contract-status.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Injectable()
export class ServiceContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateServiceContractDto) {
    const client = await this.prisma.user.findUnique({
      where: { id: dto.clientId },
    });
    if (!client) {
      throw new BadRequestException('El cliente indicado no existe');
    }

    let name = dto.name;
    let priceCents = dto.priceCents;

    // Mismo patrón que Budgets/Invoices: si hay referencia al catálogo,
    // hereda lo que no venga explícito en el body.
    if (dto.serviceId) {
      const service = await this.prisma.service.findUnique({
        where: { id: dto.serviceId },
      });
      if (!service) {
        throw new BadRequestException('El servicio indicado no existe');
      }
      name = name ?? service.name;
      priceCents = priceCents ?? service.priceCents;
    }

    return this.prisma.serviceContract.create({
      data: {
        clientId: dto.clientId,
        serviceId: dto.serviceId,
        name,
        description: dto.description,
        priceCents,
        notes: dto.notes,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: { assignments: true },
    });
  }

  async findAll(
    user: AuthenticatedUser,
    query: PaginationQueryDto & { clientId?: string },
  ) {
    const isPrivileged = user.role === 'ADMIN' || user.role === 'OWNER';
    const where = {
      deletedAt: null,
      clientId: isPrivileged ? query.clientId : user.userId,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.serviceContract.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { assignments: true },
      }),
      this.prisma.serviceContract.count({ where }),
    ]);

    return paginate(data, total, query);
  }

  async findOne(id: string) {
    const contract = await this.prisma.serviceContract.findFirst({
      where: { id, deletedAt: null },
      include: {
        service: true,
        assignments: {
          include: {
            user: { select: { id: true, email: true, details: true } },
          },
        },
      },
    });
    if (!contract) {
      throw new NotFoundException('Contrato no encontrado');
    }
    return contract;
  }

  async updateStatus(id: string, dto: UpdateServiceContractStatusDto) {
    await this.findOne(id);
    return this.prisma.serviceContract.update({
      where: { id },
      data: {
        status: dto.status,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async softDelete(id: string) {
    await this.findOne(id);
    await this.prisma.serviceContract.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async addAssignment(contractId: string, dto: CreateAssignmentDto) {
    await this.findOne(contractId);

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new BadRequestException('El usuario indicado no existe');
    }

    return this.prisma.serviceAssignment.create({
      data: { serviceContractId: contractId, userId: dto.userId },
    });
  }

  async removeAssignment(contractId: string, assignmentId: string) {
    const assignment = await this.prisma.serviceAssignment.findFirst({
      where: { id: assignmentId, serviceContractId: contractId },
    });
    if (!assignment) {
      throw new NotFoundException('Asignación no encontrada');
    }
    await this.prisma.serviceAssignment.delete({ where: { id: assignmentId } });
  }
}
