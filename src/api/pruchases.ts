import express from 'express';
import { PurchasesController } from '../controllers/purchases.controller'; 

const router = express.Router();
const controller = new PurchasesController();

router.get('/u/:id', controller.getall);
router.get('/p/:id', controller.getOne); 
router.post('/', controller.create); 
router.put('/', controller.update); 
router.delete('/', controller.remote); 

export default router;

