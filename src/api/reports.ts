import express from 'express'
import { ReportsController } from '../controllers/reports.controller'

const router = express.Router()
const reports = new ReportsController()

router.get('/invoice', reports.createInvoice)
router.get('/quotation', reports.createQuotation)
router.get('/payment', reports.createPayment)

export default router
