import express from 'express';
import { VentaController } from '../controllers/venta.controller'; 

const router = express.Router();
const ventaController = new VentaController();

router.get('/:id', ventaController.getVentaById); 

export default router;