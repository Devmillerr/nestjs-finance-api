import { Request, Response } from "express";
import { PurchasesServices } from "../services/database/purchases.services";

const services = new PurchasesServices();

export class PurchasesController {
  async getall(req: Request, res: Response) {
    const purchases = await services.getAll({
      userId: req.params.id,
    });

    res.json({
      data: purchases,
    });
  }

  async getOne(req: Request, res: Response) {
    const purchase = await services.getOne({
      id: req.params.id,
    });

    res.json({
      data: purchase,
    });
  }

  async create(req: Request, res: Response) {
    const newPurchase = await services.create(req.body);

    res.json({
      data: newPurchase,
    });
  }

  async update(req: Request, res: Response) {
    const updatePurchase = await services.update(
      { id: req.params.id },
      req.body,
    );

    res.json({
      data: updatePurchase,
    });
  }

  async remote(req: Request, res: Response) {
    const removePurchase = await services.remove({ id: req.params.id });

    res.json({
      data: removePurchase,
    });
  }
}
