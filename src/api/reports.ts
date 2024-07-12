import express from 'express'
import { ReportsController } from '../controllers/reports.controller'
import { validatorHandler } from '../middleware/validator.handler'
import {
  invoiceDataSchema,
  paymentReceiptSchema,
  quotationDataSchema,
} from '../utils/schema/reports'

const router = express.Router()
const reports = new ReportsController()

router.post(
  '/invoice',
  validatorHandler(invoiceDataSchema, 'body'),
  reports.createInvoice
)
router.post(
  '/quotation',
  validatorHandler(quotationDataSchema, 'body'),
  reports.createQuotation
)
router.post(
  '/payment',
  validatorHandler(paymentReceiptSchema, 'body'),
  reports.createPayment
)

export default router
