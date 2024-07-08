import Joi from 'joi'
export const ID_UUID = Joi.object({
  id: Joi.string().uuid(),
})
