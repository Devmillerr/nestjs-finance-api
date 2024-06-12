import express from 'express';

import users from './users';
import products from './products';
import budget from './budget';
import purchases from './pruchases';
import order from './orders'


const router = express.Router();

router.use('/users', users);
router.use('/products', products);
router.use('/budget', budget);
router.use('/purchases', purchases);
router.use('/orders', order);

export default router;
