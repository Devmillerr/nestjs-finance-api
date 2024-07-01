import Joi from 'joi'
import { join } from 'path'

export const USER_CREATE_SCHEMA = Joi.object({
    email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
})

export const USERDETAILS_CREATE_SCHEMA = Joi.object({
    firstname: Joi.string().min(1).max(255).required(),
    lastname : Joi.string().min(1).max(255).required(),
    nickname: Joi.string().min(1).max(255),
    zipcode: Joi.string().min(1).max(255),
    address: Joi.string().min(1).max(255),
    phone: Joi.string().pattern(RegExp(/^[0-9+\-().\s]{7,15}$/)),
})

export const PRODUCT_CREATE_SCHEMA = ""

