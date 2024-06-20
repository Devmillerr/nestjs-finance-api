import express from 'express';
import { BudgetController } from '../controllers/budget.controller';

const router = express.Router();
const budgetController = new BudgetController();

// TODO Rutas para obtener presupuestos
router.get('/p/:id', budgetController.getAll);
router.get('/u/:id', budgetController.getOne);

// TODO para crear, actualizar y eliminar presupuestos
router.post('/', budgetController.create);
router.put('/:id', budgetController.update);
router.delete('/:id', budgetController.remove);

export default router