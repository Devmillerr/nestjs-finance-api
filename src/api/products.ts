import express from 'express';
import { ProductController } from '../controllers/products.controller';
import {validatorHandler} from '../middleware/validator.handler'
import {ID_UUID} from '../utils/schema/general'

const router = express.Router();
const productController = new ProductController();

// TODO Rutas para obtener productos
router.get('/p/:id', validatorHandler(ID_UUID, 'params'), productController.getAll);
router.get('/u/:id', productController.getOne);

// TODO para crear, actualizar y eliminar productos
router.post('/', productController.create);
router.put('/:id', productController.update);
router.delete('/:id', productController.remove);

export default router;