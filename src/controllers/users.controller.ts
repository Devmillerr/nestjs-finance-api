import { Response, Request } from 'express';
import { UserServices } from '../services/users.services';

export class UserController {
  constructor(private service: UserServices) {}

  async getUser(res: Response, req: Request) {
    const userId = req.params.id;
    const getUser = this.service.get(+userId);
    res.json({
      data: getUser,
    });
  }
}
