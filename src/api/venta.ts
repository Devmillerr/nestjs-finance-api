import express from 'express';
import { VentaController } from '../controllers/venta.controller'; 

const router = express.Router();
const ventaController = new VentaController();

router.get('/:id', (req, res) => ventaController.getVentaById(req, res)); 

export default router;