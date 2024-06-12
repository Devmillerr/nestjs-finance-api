import { Response, Request } from 'express';
import { OrderServices } from '../services/database/orders.services';

const orderServices = new OrderServices();

export class OrderController {
    async getOrder(req: Request, res: Response){
        const orderId = req.params.id;
        const getOrder = orderServices.get(orderId);
        res.json({
            data: getOrder,
        });
    }
}