import { Request, Response } from 'express';
import { BudgetServices } from '../services/database/budget.services';
const budgetServices = new BudgetServices();

export class BudgetController{

  async getAll(req: Request, res: Response) {
    const budgets = await budgetServices.getAll({
      id: req.params.id,
    })

    res.json({
      budgets,
    })
  }
  
 async getOne(req: Request, res: Response) {
    const budget = await budgetServices.getOne({
      id: req.params.id,
    })  

    res.json({
      budget,
    });
  }

  async create(req: Request, res: Response) {
    const newBudget = await budgetServices.create(req.body);
    res.json({
      data: newBudget
    })
  }

  async update (req: Request, res: Response) {
    const updateBudget =  await budgetServices.update(
      req.body,
      {id: req.params.id}
    )
    res.json({
      data:updateBudget,
    })
  }

  async remove(req: Request,  res: Response) {
    const removeUser = await budgetServices.remmove({
      id: req.params.id,
    })
    res.json({
      data : removeUser
    })
  }

}

