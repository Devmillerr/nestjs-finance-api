import express, { Router } from 'express';

import MessageResponse from '../interfaces/MessageResponse';
import emojis from './emojis';
import users from './users';
import carts from './carts'
import products from './products';
import detuser from './detuser';
import compra from './compra';
import venta from './venta';
import pagos from './pagos';
import ordenc from './ordenc'


const router = express.Router();

router.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.use('/emojis', emojis);
router.use('/users', users);
router.use('/products', products);
router.use('/carts', carts) 
router.use('/detuser', detuser);
router.use('/compra', compra);
router.use('/venta', venta);
router.use('/pago', pagos);
router.use('/orden', ordenc)


export default router;
