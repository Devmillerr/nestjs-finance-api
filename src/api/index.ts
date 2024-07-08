import express from 'express'

import users from './users'
import products from './products'
import budgets from './budget'
import purchases from './pruchases'

const router = express.Router()

router.use('/users', users)
router.use('/products', products)
router.use('/budgets', budgets)
router.use('/purchases', purchases)

export default router
