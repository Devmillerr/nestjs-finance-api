import Joi from 'joi'

export const PRODUCT_CREATE_SCHEMA = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.number().required(),
  photo: Joi.string().uri().required(),
  type: Joi.string().valid('WEB', 'FIVEM', 'DISCORD_BOT'),
})
