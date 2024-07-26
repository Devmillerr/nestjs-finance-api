import { db } from '../db'
import { Prisma } from '@prisma/client'

export class ServicesServices {
  create(data: Prisma.servicesCreateArgs) {
    return db.services.create(data)
  }
  getOne(where: Prisma.servicesWhereInput, include: Prisma.servicesInclude) {
    return db.services.findFirst({ where, include })
  }
  getAll() {
    return db.services.findMany()
  }
  update(
    where: Prisma.servicesWhereUniqueInput,
    data: Prisma.servicesUpdateInput
  ) {
    return db.services.update({ data, where })
  }
  remove(where: Prisma.servicesWhereUniqueInput) {
    return db.services.delete({ where })
  }

  createContract(data: Prisma.service_contractsCreateArgs) {
    return db.service_contracts.create(data)
  }

  getOneContract(
    where: Prisma.service_contractsWhereInput,
    include: Prisma.servicesInclude
  ) {
    return db.service_contracts.findFirst({ where, include })
  }

  getAllContract() {
    return db.service_contracts.findMany()
  }

  updateContract(
    where: Prisma.service_contractsWhereUniqueInput,
    data: Prisma.service_contractsUpdateInput
  ) {
    return db.service_contracts.update({ where, data })
  }

  removeContract(where: Prisma.service_contractsWhereUniqueInput) {
    return db.service_contracts.delete({ where })
  }
}
