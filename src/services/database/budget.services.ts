import { db } from '../db'
import { budgets, Prisma } from '@prisma/client'

export class BudgetServices {
  create(data: Prisma.budgetsCreateInput): Promise<budgets> {
    return db.budgets.create({
      data,
    })
  }

  getAll(where: Prisma.budgetsWhereInput): Promise<budgets[]> {
    return db.budgets.findMany({
      where,
    })
  }

  getOne(where: Prisma.budgetsWhereUniqueInput): Promise<budgets | null> {
    return db.budgets.findUnique({
      where,
    })
  }

  update(
    data: Prisma.budgetsUpdateInput,
    where: Prisma.budgetsWhereUniqueInput
  ): Promise<budgets> {
    return db.budgets.update({
      data,
      where,
    })
  }

  remmove(where: Prisma.budgetsWhereUniqueInput): Promise<budgets> {
    return db.budgets.delete({
      where,
    })
  }

  createItem(data: Prisma.budget_productsCreateInput) {
    return db.budget_products.create({
      data,
    })
  }

  updateItem(
    where: Prisma.budget_productsWhereUniqueInput,
    data: Prisma.budget_productsUpdateInput
  ) {
    return db.budget_products.update({
      where,
      data,
    })
  }

  remoteItem(where: Prisma.budget_productsWhereUniqueInput) {
    return db.budget_products.delete({
      where,
    })
  }
}
