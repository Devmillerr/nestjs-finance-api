
import express from 'express';
import { ProductController } from '../controllers/products.controller';

const router = express.Router();
const productController = new ProductController();

// TODO: Terminar el CRUD -> CREATE - READ - UPDATE - DELETE

router.get('/:id', productController.getProduct);

export default router;