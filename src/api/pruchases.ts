import express from 'express';
import { PurchasesController } from '../controllers/purchases.controller'; 
import {validatorHandler} from '../middleware/validator.handler'
import {ID_UUID} from '../utils/schema/general'
import { PURCHASE_CREATE_ESCHEMA, PURCHASE_PRODUCT_CREATE_ESCHEMA } from '../utils/schema/purchase';

const router = express.Router();
const controller = new PurchasesController();

// TODO Rutas para obtener 
router.get('/All', controller.getall);
router.get('/p/:id', validatorHandler(ID_UUID, 'params'), controller.getOne); 

// TODO para crear, actualizar y eliminar compras
router.post('/', validatorHandler(PURCHASE_CREATE_ESCHEMA, 'body'),validatorHandler(PURCHASE_PRODUCT_CREATE_ESCHEMA, 'body'), controller.create); 
router.put('/:id', validatorHandler(ID_UUID, 'params'), controller.update); 
//router.put('/id:/purchsesProducts', validatorHandler(ID_UUID, 'params'), validatorHandler(PURCHASE_PRODUCT_CREATE_ESCHEMA, 'body'), controller.updatePurchaseProduct);
router.delete('/:id', controller.remote); 

export default router;

