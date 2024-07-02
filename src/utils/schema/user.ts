import Joi from 'joi'

export const USER_CREATE_SCHEMA = Joi.object({
    email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
})

export const USERDETAILS_CREATE_SCHEMA = Joi.object({
    firstname: Joi.string().required(),
    lastname : Joi.string().required(),
    nickname: Joi.string(),
    zipcode: Joi.string(),
    address: Joi.string(),
    phone: Joi.string().pattern(RegExp(/^[0-9+\-().\s]{7,15}$/)),
})