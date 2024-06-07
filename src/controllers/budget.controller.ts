import { Request, Response } from 'express';
import { BudgetServices } from '../services/budget.services';

const budgetService = new BudgetServices();

export class BudgetController {
  async getBudget(req: Request, res: Response) {
    const budgetId = req.params.id;
    const budget = await budgetService.get(budgetId);
    if (budget) {
      res.json({ data: budget });
    } else {
      res.status(404).json({ error: 'Budget not found' });
    }
  }
}
