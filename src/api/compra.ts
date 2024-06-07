import express from 'express';
import { CompraController } from '../controllers/compra.controller'; 

const router = express.Router();
const compraController = new CompraController();

// TODO: cambiar de (req, res) => compraController.getCompraById(req, res) a compraController.getCompraById
router.get('/:id', compraController.getCompraById.bind(compraController));
//router.get('/:id', (req, res) => compraController.getCompraById(req, res)); 

export default router;

