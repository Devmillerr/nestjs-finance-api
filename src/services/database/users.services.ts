import { db } from "../db";
import { users, Prisma, userDetails } from "@prisma/client";

export class UserServices {
 create(data: Prisma.usersCreateInput): Promise<users> {
  return db.users.create({
    data,
  });
 }

 getAll(where?: Prisma.usersWhereInput): Promise<users[]> {
  return db.users.findMany({
    where,
  })
 }

 getOne(where: Prisma.usersWhereUniqueInput): Promise<users | null> {
   return db.users.findUnique({
     where,
     include: {
       userdetails: true,
     },
   });
 }
 
 update(
  where: Prisma.usersWhereUniqueInput,
  data: Prisma.usersUpdateInput
 ) {
  return db.users.update(
    {
      where,
      data,
    }
  )
 }

 createDetails(data: Prisma.userDetailsCreateInput) {
  return db.userDetails.create({
    data,
  })
 }

OneDetails(where: Prisma.userDetailsWhereUniqueInput) {
  return db.userDetails.findUnique({
    where,
  })
 }

 updateDetails(
  where: Prisma.userDetailsWhereUniqueInput, data: Prisma.userDetailsUpdateInput
 ) {
  return db.userDetails.update(
    {
      where,
      data,
    }
  )
 }
 

 remove(where: Prisma.usersWhereUniqueInput){
  return db.users.delete({
    where,
  })
 }

 //Ejemplos del jefecito modificados para que no me de error xd

 getPurchases(id: string): Promise<users | null> {
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
 getBudgets(id: string): Promise<users | null> {
  return db.users.findFirst({
    where: {
      id,
    },
    include: {
      budgets: {
        include: {
          budget_products: true,
        },
      }
    }
  })
 }
}
/*
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
  }*/ 