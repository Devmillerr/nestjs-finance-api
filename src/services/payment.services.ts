import pagos from '../utils/mocks/pagos.json';

export class PagosServices {
  create(pago: any) {

    pagos.push(pago);
    return pago;
  }

  getAll() {
    return pagos;
  }

  get(id: number) {
    return pagos.filter(r => r.payment_id == id)[0];
  }
}




