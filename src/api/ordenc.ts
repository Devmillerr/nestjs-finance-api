import express from 'express'
import { ocController } from '../controllers/ordenc.controller'

const router = express.Router();
const oCController = new ocController()
router.get('/:id', oCController.getOc)

export default router;