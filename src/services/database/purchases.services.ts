import { db } from '../db'
import { purchases, Prisma, purchases_products } from '@prisma/client'

export class PurchasesServices {
  create(data: Prisma.purchasesCreateInput): Promise<purchases> {
    return db.purchases.create({
      data,
    })
  }

  getAll(where?: Prisma.purchasesWhereInput): Promise<purchases[]> {
    return db.purchases.findMany({
      where,
    })
  }

  getOne(where: Prisma.purchasesWhereUniqueInput): Promise<purchases | null> {
    return db.purchases.findUnique({
      where,
      include: {
        purchases_products: true,
        client: true,
      },
    })
  }

  update(
    where: Prisma.purchasesWhereUniqueInput,
    data: Prisma.purchasesUpdateInput
  ) {
    return db.purchases.update({
      where,
      data,
    })
  }

  remove(where: Prisma.purchasesWhereUniqueInput) {
    return db.purchases.delete({
      where,
    })
  }
}
