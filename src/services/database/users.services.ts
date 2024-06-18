import { db } from "../db";
import { Users, Prisma } from "@prisma/client";

export class UserServices {
  create(): Promise<Users> {
    return db.users.create({
      data: {
        email: "asdasdasd",
        password: "asdasdasdasd",
        userdetails: {
          create: {
            address: "mexico",
            firstname: "kamerr",
            lastname: "ezz",
            nickname: "Kamerr Ezz",
            phone: "8179248124",
            zipcode: "35235",
          },
        },
      },
    });
  }

  getAll() {}

  get(id: string) {
    return db.users.findUnique({
      where: { id },
      include: {
        userdetails: true,
      },
    });
  }

  getPurchases(id: string): Promise<Users> {
    return db.users.findFirst({
      where: {
        id,
      },
      include: {
        purchases: {
          include: {
            purchases_products: true,
          },
        },
      },
    });
  }

  getBudgets(id: string): Promise<Users> {
    return db.users.findFirst({
      where: {
        id,
      },
      include: {
        budgets: {
          include: {
            budget_products: true,
          },
        },
      },
    });
  }
}
