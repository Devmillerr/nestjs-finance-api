import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { BudgetLineDto } from './dto/budget-line.dto';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clientId: string, dto: CreateBudgetDto) {
    return this.prisma.$transaction(async (tx) => {
      const linesData = await this.resolveLines(tx, dto.lines);

      return tx.budget.create({
        data: {
          clientId,
          description: dto.description,
          lines: { create: linesData },
        },
        include: { lines: { include: { product: true } } },
      });
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
      this.prisma.budget.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { lines: true },
      }),
      this.prisma.budget.count({ where }),
    ]);

    return paginate(data, total, query);
  }

  async findOne(id: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, deletedAt: null },
      include: { lines: { include: { product: true } } },
    });
    if (!budget) {
      throw new NotFoundException('Presupuesto no encontrado');
    }
    return budget;
  }

  async update(id: string, dto: UpdateBudgetDto) {
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      if (dto.lines) {
        const linesData = await this.resolveLines(tx, dto.lines);
        await tx.budgetProduct.deleteMany({ where: { budgetId: id } });
        await tx.budgetProduct.createMany({
          data: linesData.map((line) => ({ ...line, budgetId: id })),
        });
      }

      return tx.budget.update({
        where: { id },
        data: {
          description: dto.description,
        },
        include: { lines: { include: { product: true } } },
      });
    });
  }

  async softDelete(id: string) {
    await this.findOne(id);
    await this.prisma.budget.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Regla de negocio que en V2 vivía en el controller (mal ubicada, mezclada
  // con HTTP): cada línea es O un producto de catálogo, O un ítem libre con
  // título y precio. Nunca ninguna de las dos, nunca ambas mezcladas de
  // forma ambigua.
  private async resolveLines(
    tx: Prisma.TransactionClient,
    lines: BudgetLineDto[],
  ) {
    interface ProductRef {
      id: string;
      name: string;
      description: string;
      priceCents: number;
    }

    const productIds = lines
      .map((l) => l.productId)
      .filter((id): id is string => Boolean(id));

    const products: ProductRef[] = productIds.length
      ? await tx.product.findMany({ where: { id: { in: productIds } } })
      : [];
    const productById = new Map<string, ProductRef>(
      products.map((p) => [p.id, p]),
    );

    return lines.map((line) => {
      if (line.productId) {
        const product = productById.get(line.productId);
        if (!product) {
          throw new BadRequestException(
            `Producto "${line.productId}" no existe`,
          );
        }
        return {
          productId: product.id,
          title: line.title ?? product.name,
          description: line.description ?? product.description,
          priceCents: line.priceCents ?? product.priceCents,
        };
      }

      if (!line.title || line.priceCents === undefined) {
        throw new BadRequestException(
          'Cada línea sin productId debe incluir al menos title y priceCents',
        );
      }

      return {
        productId: null,
        title: line.title,
        description: line.description ?? null,
        priceCents: line.priceCents,
      };
    });
  }
}
