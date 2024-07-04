import { Request, Response, NextFunction } from "express";
import { BudgetServices } from "../services/database/budget.services";
import boom from "@hapi/boom";
const budgetServices = new BudgetServices();

export class BudgetController {
  async getAll(req: Request, res: Response) {
    const budgets = await budgetServices.getAll({
      id: req.params.id,
    });

    res.json({
      budgets,
    });
  }

  async getOne(req: Request, res: Response) {
    const budget = await budgetServices.getOne({
      id: req.params.id,
    });

    res.json({
      budget,
    });
  }

  async create(req: Request, res: Response) {
    const newBudget = await budgetServices.create(req.body);
    res.json({
      data: newBudget,
    });
  }

  async update(req: Request, res: Response) {
    const updateBudget = await budgetServices.update(req.body, {
      id: req.params.id,
    });
    res.json({
      data: updateBudget,
    });
  }

  async createItems(req: Request, res: Response, next: NextFunction) {
    let budgetId = req.params.id;
    const budget = await budgetServices.getOne({ id: budgetId });
    if (!budget) return next(boom.notFound());

    const create = await budgetServices.createItem(req.body);
    res.json({
      data: create,
    });
  }

  async updateItems(req: Request, res: Response, next: NextFunction) {
    let budgetId = req.params.id;
    let budgetItemId = req.params.item;
    const budget = await budgetServices.getOne({ id: budgetId });
    if (!budget) return next(boom.notFound());

    const update = await budgetServices.updateItem(
      { id: budgetItemId },
      req.body
    );

    res.json({
      data: update,
    });
  }

  async removeItems(req: Request, res: Response, next: NextFunction) {
    let budgetId = req.params.id;
    let budgetItemId = req.params.item;
    const budget = await budgetServices.getOne({ id: budgetId });
    if (!budget) return next(boom.notFound());

    const update = await budgetServices.remoteItem({ id: budgetItemId });

    res.json({
      data: update,
    });
  }

  async remove(req: Request, res: Response) {
    const removeUser = await budgetServices.remmove({
      id: req.params.id,
    });
    res.json({
      data: removeUser,
    });
  }
}
