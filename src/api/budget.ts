import express from 'express'
import { BudgetController } from '../controllers/budget.controller'
import { validatorHandler } from '../middleware/validator.handler'
import { ID_UUID } from '../utils/schema/general'
import {
  ID_ITEM_UUID,
  BUDGET_PRODUCT_SCHEMA,
  BUDGET_SCHEMA,
} from '../utils/schema/budget'

const router = express.Router()
const budgetController = new BudgetController()

router.get('/All', budgetController.getAll)
router.get(
  '/u/:id',
  validatorHandler(ID_UUID, 'params'),
  budgetController.getOne
)

router.post(
  '/',
  validatorHandler(BUDGET_SCHEMA, 'body'),
  budgetController.create
)
router.post(
  '/:id/item',
  validatorHandler(ID_UUID, 'params'),
  validatorHandler(BUDGET_PRODUCT_SCHEMA, 'body'),
  budgetController.createItems
)
router.put('/:id', validatorHandler(ID_UUID, 'params'), budgetController.update)
router.put(
  '/:id/item/:item',
  validatorHandler(ID_ITEM_UUID, 'params'),
  validatorHandler(BUDGET_PRODUCT_SCHEMA, 'body'),
  budgetController.updateItems
)
router.delete(
  '/:id',
  validatorHandler(ID_UUID, 'params'),
  budgetController.remove
)
router.delete(
  '/:id/item/:item',
  validatorHandler(ID_ITEM_UUID, 'params'),
  budgetController.removeItems
)

export default router
