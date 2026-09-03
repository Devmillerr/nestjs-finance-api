import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async findAll(query: PaginationQueryDto) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count(),
    ]);
    return paginate(data, total, query);
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id); // 404 explícito antes del update
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    // Hard delete aceptable acá: un producto sin uso (sin líneas de compra/
    // presupuesto/factura) no tiene valor de auditoría por sí mismo. Si tiene
    // líneas asociadas, Prisma lo bloqueará por la FK (onDelete: Restrict por
    // default en purchase_products), lo cual es el comportamiento correcto.
    await this.prisma.product.delete({ where: { id } });
  }
}
