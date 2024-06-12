import { db } from '../db';

export class OrderServices {
  create() {
    
  }

  getAll() {
    
  }

  get(id: string) {
    return db.orders.findUnique({
      where: { id },
      include: {
        order_products: true, 
      },
    });
  }
}
