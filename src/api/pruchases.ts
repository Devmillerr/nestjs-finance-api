import express from 'express';
import { PurchasesController } from '../controllers/purchases.controller'; 
import {validatorHandler} from '../middleware/validator.handler'
import {ID_UUID} from '../utils/schema/general'

const router = express.Router();
const controller = new PurchasesController();

// TODO Rutas para obtener compras
router.get('/All', controller.getall);
router.get('/p/:id', validatorHandler(ID_UUID, 'params'), controller.getOne); 

// TODO para crear, actualizar y eliminar compras
router.post('/', controller.create); 
router.put('/:id', controller.update); 
router.delete('/:id', controller.remote); 

export default router;

