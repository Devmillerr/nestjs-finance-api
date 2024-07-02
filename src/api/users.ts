import express from 'express';
import { UserController } from '../controllers/users.controller';
import {validatorHandler} from '../middleware/validator.handler'
import { USER_CREATE_SCHEMA, USERDETAILS_CREATE_SCHEMA } from '../utils/schema/user';
import {ID_UUID} from '../utils/schema/general'

const router = express.Router();
const userController = new UserController();

router.get('/all', userController.getAll)
router.get("/u/:id", validatorHandler(ID_UUID, 'params'), userController.getOne);
router.get('/p/:id', userController.getPurchases)
router.get('/b/:id', userController.getBudgets)

router.post('/', validatorHandler(USER_CREATE_SCHEMA, 'body'), userController.create)
router.put('/u/:id', validatorHandler(ID_UUID, 'params'), userController.update)
router.put('/:id/details', validatorHandler(ID_UUID, 'params'), validatorHandler(USERDETAILS_CREATE_SCHEMA, 'body'), userController.updateDetails)
router.delete('/:id', userController.remove)

export default router;