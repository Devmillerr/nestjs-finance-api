import { Response, Request } from 'express';
import { userDServices } from '../services/userD.services';
const DServices = new userDServices();

export class UserDController {

  async getUserD(req: Request, res: Response) {
    const userDId = req.params.id;
    const getUserD = await DServices.get(+userDId);
    res.json({
      data: getUserD,
    });
  }
}