import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseStatusDto } from './dto/update-purchase-status.dto';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  // Toda la operación (leer precios, crear purchase, crear líneas) va en una
  // sola transacción de Prisma. V2 no hacía esto: una falla a mitad de camino
  // dejaba una compra sin líneas, o líneas sin compra. Acá, o se escribe todo,
  // o no se escribe nada.
  async create(clientId: string, dto: CreatePurchaseDto) {
    const productIds = dto.lines.map((line) => line.productId);

    return this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== new Set(productIds).size) {
        throw new BadRequestException(
          'Uno o más productos de la compra no existen',
        );
      }

      const priceById = new Map<string, number>(
        products.map((p) => [p.id, p.priceCents]),
      );

      // Snapshot: el precio se congela al momento de la compra, no se
      // recalcula si el producto cambia de precio después.
      const linesData = dto.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        unitPriceCents: priceById.get(line.productId)!,
      }));

      const totalCents = linesData.reduce(
        (sum: number, line) => sum + line.unitPriceCents * line.quantity,
        0,
      );

      return tx.purchase.create({
        data: {
          clientId,
          paymentMethod: dto.paymentMethod,
          totalCents,
          lines: { create: linesData },
        },
        include: { lines: { include: { product: true } } },
      });
    });
  }

  // Un usuario normal solo ve sus propias compras. ADMIN/OWNER ven todas
  // (o las de un cliente puntual si pasan ?clientId=).
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
      this.prisma.purchase.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { lines: true },
      }),
      this.prisma.purchase.count({ where }),
    ]);

    return paginate(data, total, query);
  }

  async findOne(id: string) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id, deletedAt: null },
      include: { lines: { include: { product: true } } },
    });
    if (!purchase) {
      throw new NotFoundException('Compra no encontrada');
    }
    return purchase;
  }

  async updateStatus(id: string, dto: UpdatePurchaseStatusDto) {
    await this.findOne(id);
    return this.prisma.purchase.update({
      where: { id },
      data: { paymentStatus: dto.paymentStatus },
    });
  }

  async softDelete(id: string) {
    await this.findOne(id);
    await this.prisma.purchase.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
