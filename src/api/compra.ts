import express from 'express';
import { CompraController } from '../controllers/compra.controller'; 

const router = express.Router();
const compraController = new CompraController();

router.get('/:id', (req, res) => compraController.getCompraById(req, res)); 

export default router;

