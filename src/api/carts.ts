import express from "express";
import  { CartController } from '../controllers/card.controller'

const router = express.Router();
const cartController = new CartController()

router.get('/:id', cartController.getCart)

export default router;