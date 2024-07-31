import { Router } from 'express'
import { ServicesController } from '../controllers/services.controller'
import { validatorHandler } from '../middleware/validator.handler'
import {
  SERVICE_CREATE_SCHEMA,
  CONTRACT_CREATE_SCHEMA,
  WORKE_CREATE_SCHEMA,
} from '../utils/schema/services'
import { ID_UUID } from '../utils/schema/general'

const router = Router()
const servicesController = new ServicesController()

router.get('/all', servicesController.getAll)
router.get(
  '/:id',
  validatorHandler(ID_UUID, 'params'),
  servicesController.getOne
)

router.post(
  '/',
  validatorHandler(SERVICE_CREATE_SCHEMA, 'body'),
  servicesController.create
)
router.put(
  '/:id',
  validatorHandler(SERVICE_CREATE_SCHEMA, 'body'),
  validatorHandler(ID_UUID, 'params'),
  servicesController.update
)
router.delete(
  '/:id',
  validatorHandler(ID_UUID, 'params'),
  servicesController.remove
)

router.get('/contracts/all', servicesController.getAllContracts)
router.get('/contracts/:id', servicesController.getOneContract)
router.post(
  '/contracts',
  validatorHandler(CONTRACT_CREATE_SCHEMA, 'body'),
  servicesController.createContracts
)
router.put(
  '/contracts/:id',
  validatorHandler(CONTRACT_CREATE_SCHEMA, 'body'),
  validatorHandler(ID_UUID, 'params'),
  servicesController.updateContracts
)
router.delete('/contracts/:id', servicesController.removeContracts)

router.get('/worke/all', servicesController.getAllWorke)
router.get('/worke/:id', servicesController.getOneWorke)

router.post(
  '/workes',
  validatorHandler(WORKE_CREATE_SCHEMA, 'body'),
  servicesController.createWorke
)
router.put(
  '/worke/:id',
  validatorHandler(WORKE_CREATE_SCHEMA, 'body'),
  validatorHandler(ID_UUID, 'params'),
  servicesController.updateWorke
)

router.delete('/workes/:id', servicesController.removeWorke)

export default router
