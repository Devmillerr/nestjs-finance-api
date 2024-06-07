import { db } from './db';

export class BudgetServices {
  create() {
    return db.budgets.create({
      data: {
        userId: '1',
        total: 20,
        description: 'Este es el presupuesto',
      },
    });
  }

  getAll() {
    return db.budgets.findMany({
      include: {
        budget_products: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  get(id: string) {
    return db.budgets.findUnique({
      where: { id },
      include: {
        budget_products: {
          include: {
            product: true,
          },
        },
      },
    });
  }
}
