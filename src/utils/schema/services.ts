import Joi from 'joi'

export const SERVICE_CREATE_SCHEMA = Joi.object({
  name: Joi.string().min(1).required(),
  description: Joi.string().min(1).required(),
  price: Joi.number().greater(0).required(),
  photo: Joi.string().uri().required(),
})

export const SERVICE_UPDATE_SCHEMA = Joi.object({
  name: Joi.string().min(1).required(),
  description: Joi.string().min(1).required(),
  price: Joi.number().greater(0).required(),
  photo: Joi.string().uri().required(),
})

export const CONTRACT_CREATE_SCHEMA = Joi.object({
  serviceId: Joi.string().uuid().optional(),
  clientId: Joi.string().uuid().required(),
  name: Joi.string().allow(null).optional(),
  description: Joi.string().allow(null).optional(),
  price: Joi.number().positive().allow(null).optional(),
  notes: Joi.string().allow(null).optional(),
  status: Joi.string()
    .valid('PENDING', 'COMPLETED', 'CANCELLED')
    .default('PENDING'),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().allow(null).optional(),
})

export const CONTRACT_UPDATE_SCHEMA = Joi.object({
  serviceId: Joi.string().uuid().optional(),
  clientId: Joi.string().uuid().required(),
  name: Joi.string().allow(null).optional(),
  description: Joi.string().allow(null).optional(),
  price: Joi.number().positive().allow(null).optional(),
  notes: Joi.string().allow(null).optional(),
  status: Joi.string()
    .valid('PENDING', 'COMPLETED', 'CANCELLED')
    .default('PENDING'),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().allow(null).optional(),
})
