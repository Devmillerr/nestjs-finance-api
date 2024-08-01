import express from 'express'
import { PurchasesController } from '../controllers/purchases.controller'
import { validatorHandler } from '../middleware/validator.handler'
import { ID_UUID } from '../utils/schema/general'
import { PURCHASE_CREATE_ESCHEMA } from '../utils/schema/purchase'

const router = express.Router()
const controller = new PurchasesController()

router.get('/all', controller.getall)
router.get('/u/:id', validatorHandler(ID_UUID, 'params'), controller.getOne)

router.post(
  '/',
  validatorHandler(PURCHASE_CREATE_ESCHEMA, 'body'),
  controller.create
)
router.put('/:id', validatorHandler(ID_UUID, 'params'), controller.update)
router.delete('/:id', validatorHandler(ID_UUID, 'params'), controller.removed)

export default router
