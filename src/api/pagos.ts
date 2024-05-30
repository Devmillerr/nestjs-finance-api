import express from 'express'; 
import { PagosController } from '../controllers/pago.controller';

const router = express.Router();
const pagosController = new PagosController(); 

router.get('/:id', (req, res) => pagosController.getPago(req, res)); 

export default router;


