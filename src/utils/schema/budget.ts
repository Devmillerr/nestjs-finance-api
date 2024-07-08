import Joi from 'joi'
export const ID_ITEM_UUID = Joi.object({
  id: Joi.string().uuid(),
  item: Joi.string().uuid(),
})

export const BUDGET_SCHEMA = Joi.object({
  userId: Joi.string().required(),
  description: Joi.string().required(),
  total: Joi.number().optional(),
  payment_method: Joi.string()
    .valid('PAYPAL', 'STRIPE', 'CRYPTO')
    .default('PAYPAL'),
  payment_status: Joi.string()
    .valid('COMPLETED', 'PENDING', 'NOT_COMPLETED', 'CANCELED')
    .default('NOT_COMPLETED'),
})

export const BUDGET_PRODUCT_SCHEMA = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  price: Joi.number().optional(),
  productId: Joi.string().uuid().optional(),
})
