import express from 'express'
import { UserController } from '../controllers/users.controller'
import { validatorHandler } from '../middleware/validator.handler'
import {
  USER_CREATE_SCHEMA,
  USERDETAILS_CREATE_SCHEMA,
} from '../utils/schema/user'
import { ID_UUID } from '../utils/schema/general'

const router = express.Router()
const userController = new UserController()

router.get('/all', userController.getAll)
router.get('/:id/u', validatorHandler(ID_UUID, 'params'), userController.getOne)
router.get(
  '/:id/p',
  validatorHandler(ID_UUID, 'params'),
  userController.getPurchases
)
router.get(
  '/:id/g',
  validatorHandler(ID_UUID, 'params'),
  userController.getBudgets
)

router.post(
  '/',
  validatorHandler(USER_CREATE_SCHEMA, 'body'),
  userController.create
)
router.put('/:id', validatorHandler(ID_UUID, 'params'), userController.update)
router.put(
  '/:id/details',
  validatorHandler(ID_UUID, 'params'),
  validatorHandler(USERDETAILS_CREATE_SCHEMA, 'body'),
  userController.updateDetails
)
router.delete(
  '/:id',
  validatorHandler(ID_UUID, 'params'),
  userController.remove
)

export default router
