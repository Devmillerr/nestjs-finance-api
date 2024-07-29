import { Response, Request, NextFunction } from 'express'
import boom from '@hapi/boom'
import { ServicesServices } from '../services/database/services.services'

const servicesServices = new ServicesServices()

export class ServicesController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    const services = await servicesServices.getAll()
    res.json(services)
    next(boom.badImplementation('Error al obtener los servicios'))
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id

    if (!id) {
      return next(boom.badRequest('El parámetro id es requerido'))
    }

    const include = {}
    const service = await servicesServices.getOne({ id }, include)

    if (!service) {
      return next(boom.notFound('Servicio no encontrado'))
    }

    res.json({
      data: service,
    })
  }

  async create(req: Request, res: Response) {
    const newService = await servicesServices.create(req.body)
    res.json({
      data: newService,
    })
  }

  async update(req: Request, res: Response, next: NextFunction) {
    const updateService = await servicesServices.update(req.body, {
      id: req.params.id,
    })

    res.json({
      data: updateService,
    })
  }

  async remove(req: Request, res: Response) {
    const removeService = await servicesServices.remove({ id: req.params.id })
    res.json({
      data: removeService,
    })
  }

  async getAllContracts(req: Request, res: Response) {
    const contracts = await servicesServices.getAllContract()
    res.json(contracts)
  }

  async getOneContract(req: Request, res: Response) {
    const id = req.params.id
    const include = {}

    const contract = await servicesServices.getOneContract({ id }, include)

    res.json({
      data: contract,
    })
  }

  async createContracts(req: Request, res: Response) {
    const newContract = await servicesServices.createContract(req.body)
    res.json({
      data: newContract,
    })
  }

  async updateContracts(req: Request, res: Response) {
    const updateContract = await servicesServices.updateContract(
      { id: req.params.id },
      req.body
    )
    res.json({
      data: updateContract,
    })
  }

  async removeContracts(req: Request, res: Response) {
    const removeContract = await servicesServices.removeContract({
      id: req.params.id,
    })
    res.json({
      data: removeContract,
    })
  }
}
