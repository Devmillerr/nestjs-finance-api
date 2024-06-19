import express from 'express';
import { ProductController } from '../controllers/products.controller';

const router = express.Router();
const productController = new ProductController();

// TODO: Terminar el CRUD -> CREATE - READ - UPDATE - DELETE
router.get('/p/:id', productController.getAll);
router.get('/u/:id', productController.getOne);
router.get('/', productController.create);
router.get('/', productController.update);
router.get('/', productController.remove);

export default router;