import express from 'express'
import passport from '../services/auth'
import { AuthController } from '../controllers/auth.controller'
import { validatorHandler } from '../middleware/validator.handler'
import { registrationSchema } from '../utils/schema/auth'

const router = express.Router()
const controller = new AuthController()

router.post('/login', passport.authenticate('local'))
router.post(
  '/register',
  validatorHandler(registrationSchema, 'body'),
  controller.register
)

export default router
