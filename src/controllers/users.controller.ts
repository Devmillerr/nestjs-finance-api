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
      userdetailsId: req.params.id
    })
    res.json({
      data: User
    })
  }

  async create(req: Request, res: Response){
    if(Object.values(req.body).length === 0){
      return res.status(400).json({
        message: 'No data provided',
      });
    }

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
