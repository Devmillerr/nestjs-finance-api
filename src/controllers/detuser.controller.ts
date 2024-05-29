import { Response, Request } from 'express';
import { DetuserServices } from '../services/detuser.services';

const detuserServices = new DetuserServices();

export class DetuserController {
  async getDetuser(req: Request, res: Response): Promise<void> {
    const detuserId = req.params.id;
    const getDetuser = detuserServices.get(detuserId);
    if (getDetuser) {
      res.json({
        data: getDetuser,
      });
    } else {
      res.status(404).json({
        message: 'User not found',
      });
    }
  }
}
