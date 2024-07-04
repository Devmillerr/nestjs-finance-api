import Joi from "joi";

export const PURCHASE_CREATE_ESCHEMA = Joi.object({
    userId: Joi.string().uuid().required(),
    payment_method: Joi.string().valid('Paypal', 'OtherPaymentMethods').default('Paypal'), 
    payment_status: Joi.string().valid('Not_Completed', 'Completed').default('Not_Completed'),
})

export const PURCHASE_PRODUCT_CREATE_ESCHEMA = Joi.object({
    purchaseId: Joi.string().required(),
    productId: Joi.string().required(),
})