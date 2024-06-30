import { Response, Request } from 'express';
import { UserServices } from '../services/database/users.services';
const userServices = new UserServices();


export class UserController {

  async getAll(req: Request, res: Response) {
    const Users = await userServices.getAll({
      userdetailsId: req.params.id,
    });
    res.json({
      data: Users,
    });
  }

  async getOne(req: Request, res: Response){
    const User = await userServices.getOne({
      id: req.params.id
    })
    res.json({
      data: User
    })
  }

  async getPurchases(req: Request, res: Response) {
    const User = await userServices.getPurchases(req.params.id)

    res.json({
      data: User
    })
  }

  async getBudgets(req: Request, res: Response) {
    const User = await userServices.getBudgets(req.params.id)

    res.json({
      data: User
    })
  }

  async create(req: Request, res: Response){
    const newUser = await userServices.create({
      email: req.body.email,
      password: req.body.password,
    });
    res.json({
      data: newUser,
    })
  }

  async update(req: Request, res: Response){
    const updateUser = await userServices.update(
      req.body,
      {id: req.params.id}
    )
    res.json({
      data:updateUser,
    })
  }

async remove(req: Request, res: Response){
  const removeUser = await userServices.remove({
    id: req.params.id,
  });
  res.json({
    data: removeUser,
  });
}

}
