import express from 'express'
import passport from '../services/auth'
import { AuthController } from '../controllers/auth.controller'
import { validatorHandler } from '../middleware/validator.handler'
import { registrationSchema } from '../utils/schema/auth'

const router = express.Router()
const controller = new AuthController()

router.get('/status', controller.status)
router.post('/login', passport.authenticate('local'), (req, res) =>
  res.send(req?.user)
)
router.post(
  '/register',
  validatorHandler(registrationSchema, 'body'),
  controller.register
)

export default router
