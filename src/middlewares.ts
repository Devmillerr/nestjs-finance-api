import { NextFunction, Request, Response } from 'express'
import boom from '@hapi/boom'

import ErrorResponse from './interfaces/ErrorResponse'

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

// TODO: verificar si es admin
export const isAdmin = () => {
  return () => {}
}

// TODO: validar permisos
export const isPerms = (perms: string[]) => {
  return () => {}
}
