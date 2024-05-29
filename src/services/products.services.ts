import productMocks from '../utils/mocks/products.json';

export class ProductServices {
  private products = productMocks;

  get(id: number) {
    return this.products.find(product => product.id === id);
  }
}
