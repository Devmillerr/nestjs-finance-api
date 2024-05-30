import ventas from '../utils/mocks/ventas.json';

export interface Venta { 
  venta_id: number;
  user_id: number;
  order_id: number;
  payment_id: number;
  total_amount: number;
  venta_date: string;
}

export class VentaService {
  private ventas: Venta[] = ventas;

  getVentasById(id: number): Venta | undefined {
    return this.ventas.find(venta => venta.venta_id === id);
  }

  getVentasByUserId(userId: number): Venta[] {
    return this.ventas.filter(venta => venta.user_id === userId);
  }
}