import { Response, Request } from 'express';
import { UserServices } from '../services/users.services';
const userServices = new UserServices();


export class UserController {

  async getUser(req: Request, res: Response) {
    const userId = req.params.id;
    const getUser = userServices.get(+userId);
    res.json({
      data: getUser,
    });
  }
}
