import boom from '@hapi/boom'
import { NextFunction, Response, Request } from 'express'

export const validatorHandler = (
  schema: any,
  property: 'body' | 'params' | 'query'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[property]
    const { error } = schema.validate(data)
    console.log(data, error)

    if (error) {
      next(boom.badRequest(error))
    } else {
      next()
    }
  }
}
