import express from 'express';
import { BudgetController } from '../controllers/budget.controller';

const router = express.Router();
const budgetController = new BudgetController();

// TODO: Terminar el CRUD -> CREATE - READ - UPDATE - DELETE

router.get('/:id', budgetController.getBudget);

export default router;