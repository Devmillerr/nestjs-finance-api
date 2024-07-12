import Joi from 'joi'

export const invoiceDataSchema = Joi.object({
  client: Joi.object({
    name: Joi.string().required(),
    address: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email().required(),
  }).required(),
  invoiceDetails: Joi.object({
    paymentFormatNumber: Joi.string().required(),
    issuedDate: Joi.string().isoDate().required(),
    dueDate: Joi.string().isoDate().required(),
    paymentMethod: Joi.string().required(),
  }).required(),
  items: Joi.array()
    .items(
      Joi.object({
        description: Joi.string().required(),
        price: Joi.number().required(),
      })
    )
    .required(),
  totals: Joi.object({
    subtotal: Joi.number().required(),
    additionalCharges: Joi.array().items(
      Joi.object({
        description: Joi.string().required(),
        amount: Joi.number().required(),
      })
    ),
    discounts: Joi.array().items(
      Joi.object({
        description: Joi.string().required(),
        amount: Joi.number().required(),
      })
    ),
    tax: Joi.number(),
    total: Joi.number().required(),
  }).required(),
  notes: Joi.string(),
  footer: Joi.string().required(),
})

export const quotationDataSchema = Joi.object({
  client: Joi.object({
    name: Joi.string().required(),
    code: Joi.string().required(),
  }).required(),
  invoiceDetails: Joi.object({
    paymentFormatNumber: Joi.string().required(),
    issuedDate: Joi.string().isoDate().required(),
  }).required(),
  items: Joi.array()
    .items(
      Joi.object({
        description: Joi.string().required(),
        price: Joi.number().required(),
      })
    )
    .required(),
  totals: Joi.object({
    subtotal: Joi.number().required(),
    additionalCharges: Joi.array().items(
      Joi.object({
        description: Joi.string().required(),
        amount: Joi.number().required(),
      })
    ),
    discounts: Joi.array().items(
      Joi.object({
        description: Joi.string().required(),
        amount: Joi.number().required(),
      })
    ),
    tax: Joi.number(),
    total: Joi.number().required(),
  }).required(),
  notes: Joi.string(),
  footer: Joi.string().required(),
  details: Joi.string().required(),
})

export const paymentReceiptSchema = Joi.object({
  employeeName: Joi.string().required(),
  employeeId: Joi.string().required(),
  paymentDate: Joi.string().isoDate().required(),
  amount: Joi.string().required(),
  paymentMethod: Joi.string().required(),
  additionalNotes: Joi.string(),
})
