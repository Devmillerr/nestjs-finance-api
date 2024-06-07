import compras from '../../utils/mocks/compras.json';

interface Compra {
  id: number;
  user_id: number;
  fecha_compra: string;
  total: number;
  productos: { product_id: number; quantity: number }[];
}

export class CompraService {
  private compras: Compra[] = compras;

  getCompraById(id: number): Compra | undefined {
    return this.compras.find(compra => compra.id === id);
  }

  getComprasByUserId(userId: number): Compra[] {
    return this.compras.filter(compra => compra.user_id === userId);
  }
}

