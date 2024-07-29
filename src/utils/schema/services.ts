import Joi from 'joi'

export const SERVICE_CREATE_SCHEMA = Joi.object({
  name: Joi.string().min(1).required(),
  description: Joi.string().min(1).required(),
  price: Joi.number().greater(0).required(),
  photo: Joi.string().uri().required(),
})

export const CONTRACT_CREATE_SCHEMA = Joi.object({
  serviceId: Joi.string().uuid().required(), // Asumiendo que `serviceId` es un UUID
  clientId: Joi.string().uuid().required(), // Asumiendo que `clientId` es un UUID
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  price: Joi.number().optional(),
  start_date: Joi.date().iso().required(), // Validación para formato ISO-8601
  end_date: Joi.date().iso().optional(), // Opcional, si está presente, debe ser ISO-8601
})
