import { NextFunction, Request, Response } from 'express'
import { permissionTypes, roleTypes, users } from '@prisma/client'

import boom from '@hapi/boom'

import ErrorResponse from './interfaces/ErrorResponse'
import { db } from './services/db'

export function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404)
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`)
  next(error)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: Error,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
) {
  if (boom.isBoom(err)) {
    const { output } = err
    res.status(output.statusCode).json(output.payload)
  } else {
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500
    res.status(statusCode)
    res.json({
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    })
  }
}

interface AuthenticatedRequest extends Request {
  user?: users
}

export const hasPermission = ({
  userId,
  permissionName,
  role,
}: {
  userId: string
  permissionName: permissionTypes
  role?: roleTypes
  two?: boolean
}) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (role && req.user?.role !== role) {
        throw boom.unauthorized()
      }

      if (permissionName) {
        const perms = await db.user_permissions.findFirst({
          where: {
            userId,
            permission: { name: permissionName },
          },
        })

        if (!perms) {
          throw boom.unauthorized()
        }
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}
