import { Response, Request } from 'express'
import { CartServices } from '../services/cart.services'
const cartservices = new CartServices();

export class CartController {
    async getCart(req: Request, res: Response){
        const CartID = req.params.id;
        const getCart = await  cartservices.get(+CartID)
        res.json({
            data: getCart,
        });
    }
}