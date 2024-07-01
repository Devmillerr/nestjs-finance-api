import express from 'express';
import { BudgetController } from '../controllers/budget.controller';
import {validatorHandler} from '../middleware/validator.handler'
import {ID_UUID} from '../utils/schema/general'

const router = express.Router();
const budgetController = new BudgetController();

// TODO Rutas para obtener presupuestos
router.get('/All', budgetController.getAll);
router.get('/u/:id', validatorHandler(ID_UUID, 'params'), budgetController.getOne);

// TODO para crear, actualizar y eliminar presupuestos
router.post('/', budgetController.create);
router.put('/:id', budgetController.update);
router.delete('/:id', budgetController.remove);

export default router