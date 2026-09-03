import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceLineDto } from './dto/invoice-line.dto';
import { InvoiceChargeDto } from './dto/invoice-charge.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

interface InvoiceTotals {
  subtotalCents: number;
  chargesCents: number;
  totalCents: number;
}

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInvoiceDto) {
    return this.prisma.$transaction(async (tx) => {
      const client = await tx.user.findUnique({ where: { id: dto.clientId } });
      if (!client) {
        throw new BadRequestException('El cliente indicado no existe');
      }

      const linesData = await this.resolveLines(tx, dto.lines);

      const invoice = await tx.invoice.create({
        data: {
          clientId: dto.clientId,
          paymentMethod: dto.paymentMethod,
          expiration: new Date(dto.expiration),
          lines: { create: linesData },
          charges: dto.charges
            ? {
                create: dto.charges.map((c) => ({
                  type: c.type,
                  amountCents: c.amountCents,
                })),
              }
            : undefined,
        },
        include: { lines: true, charges: true },
      });

      return {
        ...invoice,
        ...this.computeTotals(invoice.lines, invoice.charges),
      };
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
      this.prisma.invoice.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { lines: true, charges: true },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    const withTotals = data.map((invoice) => ({
      ...invoice,
      ...this.computeTotals(invoice.lines, invoice.charges),
    }));

    return paginate(withTotals, total, query);
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      include: {
        lines: {
          include: { product: true, service: true, serviceContract: true },
        },
        charges: true,
      },
    });
    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }
    return {
      ...invoice,
      ...this.computeTotals(invoice.lines, invoice.charges),
    };
  }

  async updateStatus(id: string, dto: UpdateInvoiceStatusDto) {
    await this.findOne(id);
    return this.prisma.invoice.update({
      where: { id },
      data: {
        paymentStatus: dto.paymentStatus,
        paymentTransaction: dto.paymentTransaction,
      },
    });
  }

  // Cargo posterior a la emisión (ej. mora, ajuste). No se tocan las líneas
  // originales -> se preserva el snapshot de lo facturado, el cargo queda
  // registrado como un evento aparte con su propio timestamp.
  async addCharge(id: string, dto: InvoiceChargeDto) {
    await this.findOne(id);
    return this.prisma.invoiceCharge.create({
      data: { invoiceId: id, type: dto.type, amountCents: dto.amountCents },
    });
  }

  async softDelete(id: string) {
    await this.findOne(id);
    await this.prisma.invoice.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private computeTotals(
    lines: { priceCents: number }[],
    charges: { type: string; amountCents: number }[],
  ): InvoiceTotals {
    const subtotalCents = lines.reduce(
      (sum: number, l) => sum + l.priceCents,
      0,
    );
    const chargesCents = charges.reduce((sum: number, c) => {
      const signed = c.type === 'DISCOUNT' ? -c.amountCents : c.amountCents;
      return sum + signed;
    }, 0);
    return {
      subtotalCents,
      chargesCents,
      totalCents: subtotalCents + chargesCents,
    };
  }

  // Cada línea referencia como mucho UNO de producto/servicio/contrato, o
  // ninguno (ítem libre). Nunca dos referencias combinadas: sería ambiguo
  // de qué snapshot viene el precio.
  private async resolveLines(
    tx: Prisma.TransactionClient,
    lines: InvoiceLineDto[],
  ) {
    interface SnapshotSource {
      id: string;
      name: string;
      description: string | null;
      priceCents: number;
    }

    const productIds = lines
      .map((l) => l.productId)
      .filter((v): v is string => Boolean(v));
    const serviceIds = lines
      .map((l) => l.serviceId)
      .filter((v): v is string => Boolean(v));
    const contractIds = lines
      .map((l) => l.serviceContractId)
      .filter((v): v is string => Boolean(v));

    interface RawProduct {
      id: string;
      name: string;
      description: string;
      priceCents: number;
    }
    interface RawService {
      id: string;
      name: string;
      description: string;
      priceCents: number;
    }
    interface RawContract {
      id: string;
      name: string | null;
      description: string | null;
      priceCents: number | null;
    }

    const [products, services, contracts]: [
      RawProduct[],
      RawService[],
      RawContract[],
    ] = await Promise.all([
      productIds.length
        ? tx.product.findMany({ where: { id: { in: productIds } } })
        : [],
      serviceIds.length
        ? tx.service.findMany({ where: { id: { in: serviceIds } } })
        : [],
      contractIds.length
        ? tx.serviceContract.findMany({ where: { id: { in: contractIds } } })
        : [],
    ]);

    const productById = new Map<string, SnapshotSource>(
      products.map((p) => [
        p.id,
        {
          id: p.id,
          name: p.name,
          description: p.description,
          priceCents: p.priceCents,
        },
      ]),
    );
    const serviceById = new Map<string, SnapshotSource>(
      services.map((s) => [
        s.id,
        {
          id: s.id,
          name: s.name,
          description: s.description,
          priceCents: s.priceCents,
        },
      ]),
    );
    const contractById = new Map<string, SnapshotSource>(
      contracts.map((c) => [
        c.id,
        {
          id: c.id,
          name: c.name ?? 'Contrato de servicio',
          description: c.description,
          priceCents: c.priceCents ?? 0,
        },
      ]),
    );

    return lines.map((line) => {
      const refCount = [
        line.productId,
        line.serviceId,
        line.serviceContractId,
      ].filter(Boolean).length;

      if (refCount > 1) {
        throw new BadRequestException(
          'Una línea de factura no puede referenciar más de un producto/servicio/contrato a la vez',
        );
      }

      let source: SnapshotSource | undefined;
      if (line.productId) {
        source = productById.get(line.productId);
        if (!source)
          throw new BadRequestException(
            `Producto "${line.productId}" no existe`,
          );
      } else if (line.serviceId) {
        source = serviceById.get(line.serviceId);
        if (!source)
          throw new BadRequestException(
            `Servicio "${line.serviceId}" no existe`,
          );
      } else if (line.serviceContractId) {
        source = contractById.get(line.serviceContractId);
        if (!source)
          throw new BadRequestException(
            `Contrato "${line.serviceContractId}" no existe`,
          );
      }

      if (!source && (!line.name || line.priceCents === undefined)) {
        throw new BadRequestException(
          'Cada línea sin referencia debe incluir al menos name y priceCents',
        );
      }

      return {
        productId: line.productId ?? null,
        serviceId: line.serviceId ?? null,
        serviceContractId: line.serviceContractId ?? null,
        name: line.name ?? source!.name,
        description: line.description ?? source?.description ?? null,
        priceCents: line.priceCents ?? source!.priceCents,
      };
    });
  }
}
