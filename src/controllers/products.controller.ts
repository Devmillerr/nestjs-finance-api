import { Response, Request } from 'express';
import { ProductServices } from '../services/products.services';
const productServices = new ProductServices();

export class ProductController {
  async getProduct(req: Request, res: Response) {
    const productId = +req.params.id;
    const product = productServices.get(productId);
    res.json({
      data: product,
    });
  }
}
