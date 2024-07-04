import { Response, Request, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { UserServices } from "../services/database/users.services";
import boom from "@hapi/boom";

const userServices = new UserServices();

const prisma = new PrismaClient();

export class UserController {
  async getAll(req: Request, res: Response) {
    const Users = await userServices.getAll({
      userdetailsId: req.params.id,
    });
    res.json({
      data: Users,
    });
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    const User = await userServices.getOne({
      id: req.params.id,
    });

    if(!User) return next(boom.notFound())

    res.json({
      data: User,
    });
  }

  async getPurchases(req: Request, res: Response, next: NextFunction) {
    const User = await userServices.getPurchases(req.params.id);

    if(!User) return next(boom.notFound())

    res.json({
      data: User,
    });
  }

  async getBudgets(req: Request, res: Response) {
    const User = await userServices.getBudgets(req.params.id);

    res.json({
      data: User,
    });
  }

  async create(req: Request, res: Response) {
    const newUser = await userServices.create({
      email: req.body.email,
      password: req.body.password,
    });
    res.json({
      data: newUser,
    });
  }

  async update(req: Request, res: Response) {
    let body = req.body;
    let id = req.params.id;
    const updateUser = await userServices.update({ id }, body);
    res.json({
      data: updateUser,
    });
  }

  async updateDetails(req: Request, res: Response, next: NextFunction) {
    const userId = req.params.id;
    const getUser = await userServices.getOne({ id: userId });

    if (getUser && getUser.userdetailsId) {
      
      const dataUserDetails = await userServices.updateDetails(
        { id: getUser.userdetailsId },
        req.body
      );

      res.json({
        data: dataUserDetails,
      });

    } else {

      const dataUserDetails = await userServices.createDetails(req.body);
      
      res.json({
        data: dataUserDetails,
      });

    }
  }

  async remove(req: Request, res: Response) {
    const removeUser = await userServices.remove({
      id: req.params.id,
    });
    res.json({
      data: removeUser,
    });
  }
}
