import express from 'express';
import { OrderController } from '../controllers/orders.controller';

const router = express.Router();
const OrderControllerRouter = new OrderController();


router.get('/:id', OrderControllerRouter.getOrder);

export default router;