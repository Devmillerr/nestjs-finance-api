import Joi from 'joi'

export const SERVICE_CREATE_SCHEMA = Joi.object({
  name: Joi.string().min(1).required(),
  description: Joi.string().min(1).required(),
  price: Joi.number().greater(0).required(),
  photo: Joi.string().uri().required(),
})

export const CONTRACT_CREATE_SCHEMA = Joi.object({
  serviceId: Joi.string().uuid().required(),
  clientId: Joi.string().uuid().required(),
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  price: Joi.number().optional(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().optional(),
})

export const WORKE_CREATE_SCHEMA = Joi.object({
  servicecontractId: Joi.string().uuid().required(),
  teamId: Joi.string().uuid().required(),
})
