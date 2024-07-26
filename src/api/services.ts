import { Router } from 'express'
import { ServicesController } from '../controllers/services.controller'
import { validatorHandler } from '../middleware/validator.handler'
import {
  SERVICE_CREATE_SCHEMA,
  SERVICE_UPDATE_SCHEMA,
  CONTRACT_CREATE_SCHEMA,
  CONTRACT_UPDATE_SCHEMA,
} from '../utils/schema/services' // Asegúrate de definir y exportar estos esquemas en tu archivo de esquemas
import { ID_UUID } from '../utils/schema/general'

const router = Router()
const servicesController = new ServicesController()

//NOTE Rutas para servicios
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
  '/services/:id',
  validatorHandler(SERVICE_UPDATE_SCHEMA, 'body'),
  validatorHandler(ID_UUID, 'params'),
  servicesController.update
)
router.delete(
  '/services/:id',
  validatorHandler(ID_UUID, 'params'),
  servicesController.remove
)

// NOTE Rutas para contratos de servicios
router.get('/contracts', servicesController.getAllContracts)
router.get('/contracts/:id', servicesController.getOneContract)
router.post(
  '/contracts',
  validatorHandler(CONTRACT_CREATE_SCHEMA, 'body'),
  servicesController.createContracts
)
router.put(
  '/contracts/:id',
  validatorHandler(CONTRACT_UPDATE_SCHEMA, 'body'),
  validatorHandler(ID_UUID, 'params'),
  servicesController.updateContracts
)
router.delete(
  '/contracts/:id',
  servicesController.removeContracts.bind(servicesController)
)

export default router
