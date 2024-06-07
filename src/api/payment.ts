import express from 'express'; 
import { PagosController } from '../controllers/payment.controller';

const router = express.Router();
const pagosController = new PagosController(); 

router.get('/:id', pagosController.getPago); 

export default router;


