import { NextFunction, Request, Response } from 'express'
import { UserServices } from '../services/database/users.services'
import { createHash } from '../utils/bcrypt'
import Boom from '@hapi/boom'

const services = new UserServices()

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    const passwordHash = createHash(req.body.password)

    await services.create({
      email: req.body.email,
      password: passwordHash,
    })

    res.json({
      data: true,
    })
  }

  async status(req: Request, res: Response, next: NextFunction) {
    return req.user ? res.status(200) : res.json(Boom.unauthorized)
  }
}
