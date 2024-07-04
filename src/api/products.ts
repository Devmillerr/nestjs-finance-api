import express from 'express';
import { ProductController } from '../controllers/products.controller';
import {validatorHandler} from '../middleware/validator.handler'
import { PRODUCT_CREATE_SCHEMA } from '../utils/schema/product';
import {ID_UUID} from '../utils/schema/general'

const router = express.Router();
const productController = new ProductController();

router.get('/All', productController.getAll);
router.get('/u/:id', validatorHandler(ID_UUID, 'params'), productController.getOne);

router.post('/', validatorHandler(PRODUCT_CREATE_SCHEMA, 'body'), productController.create);
router.put('/:id',validatorHandler(ID_UUID, 'params'), productController.update);
router.delete('/:id', validatorHandler(ID_UUID, 'params'), productController.remove);

export default router;