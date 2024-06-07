import express from 'express';
import { CompraController } from '../controllers/compra.controller'; 

const router = express.Router();
const compraController = new CompraController();

// TODO: cambiar de (req, res) => compraController.getCompraById(req, res) a compraController.getCompraById
<<<<<<< HEAD
router.get('/:id', compraController.getCompraById.bind(compraController));
//router.get('/:id', (req, res) => compraController.getCompraById(req, res)); 
=======
router.get('/:id', compraController.getCompraById); 
>>>>>>> fde17e92322bfbbed23ca30421d358c8f51a51b2

export default router;

