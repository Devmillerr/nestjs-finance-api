import express from 'express';
import { BudgetController } from '../controllers/budget.controller';

const router = express.Router();
const budgetController = new BudgetController();

router.get('/:id', budgetController.getBudget);

export default router;
