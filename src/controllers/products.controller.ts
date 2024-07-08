import { Response, Request } from 'express'
import { ProductServices } from '../services/database/products.services'
const productServices = new ProductServices()

export class ProductController {
  async getAll(req: Request, res: Response) {
    const products = await productServices.getAll({
      id: req.params.id,
    })

    res.json({
      products,
    })
  }

  async getOne(req: Request, res: Response) {
    const product = await productServices.getOne({
      id: req.params.id,
    })

    res.json({
      product,
    })
  }

  async create(req: Request, res: Response) {
    const newProduct = await productServices.create(req.body)
    res.json({
      data: newProduct,
    })
  }

  async update(req: Request, res: Response) {
    const updateProduct = await productServices.update(req.body, {
      id: req.params.id,
    })
    res.json({
      data: updateProduct,
    })
  }

  async remove(req: Request, res: Response) {
    const removeUser = await productServices.remove({
      id: req.params.id,
    })
    res.json({
      data: removeUser,
    })
  }
}
