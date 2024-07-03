import { Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserServices } from '../services/database/users.services';
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
    let body = req.body
    let id = req.params.id
    const updateUser = await userServices.update({ id }, body)
    res.json({
      data: updateUser,
    })
  }


  async updateDetails(req: Request, res: Response) {
    const userId = req.params.id;
    const { firstname, lastname, nickname, zipcode, address, phone } = req.body;

    const existingUserDetails = await prisma.userDetails.findUnique({
      where: { id: userId },
    });

    if (existingUserDetails) {
      const updatedUserDetails = await prisma.userDetails.update({
        where: { id: userId },
        data: {
          firstname,
          lastname,
          nickname,
          zipcode,
          address,
          phone,
        },
        include: {
          user: true,
        },
      });

      res.json(updatedUserDetails.user);
    } else {
      const createdUserDetails = await prisma.userDetails.create({
        data: {
          firstname,
          lastname,
          nickname,
          zipcode,
          address,
          phone,
          user: {
            connect: { id: userId },
          },
        },
        include: {
          user: true,
        },
      });

      res.json(createdUserDetails.user);
    }
  }
  

  
  
    /*
    const update_users_details = await userServices.updateDetails({
      id: req.params.id
    }, req.body)
     */


  async remove(req: Request, res: Response){
  const removeUser = await userServices.remove({
    id: req.params.id,
  });
  res.json({
    data: removeUser,
  });
}

}
