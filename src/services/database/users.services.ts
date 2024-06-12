import { db } from  '../db';

export class UserServices {
  create() {
    return db.users.create({
      data: {
        email: 'asdasdasd',
        password: 'asdasdasdasd',
        userdetails: {
          create: {
            address: 'mexico',
            firstname: 'kamerr',
            lastname: 'ezz',
            nickname: 'Kamerr Ezz',
            phone: '8179248124',
            zipcode: '35235',
          },
        },
      },
    });
  }

  getAll() {}

  get(id: string) {
    return db.orders.findUnique({
      where: { id },
      include: {
        ordersdetails: true,
      },
    });
  }
}

