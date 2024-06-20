import express from 'express';
import { PurchasesController } from '../controllers/purchases.controller'; 

const router = express.Router();
const controller = new PurchasesController();

// TODO Rutas para obtener compras
router.get('/u/:id', controller.getall);
router.get('/p/:id', controller.getOne); 

// TODO para crear, actualizar y eliminar compras
router.post('/', controller.create); 
router.put('/:id', controller.update); 
router.delete('/:id', controller.remote); 

export default router;

