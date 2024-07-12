import { NextFunction, Request, Response } from 'express'
import { UserServices } from '../services/database/users.services'
import { createHash } from '../utils/bcrypt'

const services = new UserServices()

export class AuthController {
  register(req: Request, res: Response, next: NextFunction) {
    const passwordHash = createHash(req.body.password)

    services.create({
      email: req.body.email,
      password: passwordHash,
    })
  }
}
