import express from 'express'; 
import { PagosController } from '../controllers/pago.controller';

const router = express.Router();
const pagosController = new PagosController(); 

router.get('/:id', pagosController.getPago); 

export default router;


