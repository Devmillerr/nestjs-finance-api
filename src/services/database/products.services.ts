import { db } from '../db'
import { products, Prisma } from '@prisma/client'

export class ProductServices {
  create(data: Prisma.productsCreateInput): Promise<products> {
    return db.products.create({
      data,
    })
  }

  getAll(where?: Prisma.productsWhereInput): Promise<products[]> {
    return db.products.findMany({
      where,
    })
  }

  getOne(where: Prisma.productsWhereUniqueInput): Promise<products | null> {
    return db.products.findUnique({
      where,
    })
  }

  update(
    data: Prisma.productsUpdateInput,
    where: Prisma.productsWhereUniqueInput
  ): Promise<products> {
    return db.products.update({
      data,
      where,
    })
  }

  remove(where: Prisma.productsWhereUniqueInput): Promise<products> {
    return db.products.delete({
      where,
    })
  }
}
