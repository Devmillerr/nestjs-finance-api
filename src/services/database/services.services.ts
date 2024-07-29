import { db } from '../db'
import { Prisma } from '@prisma/client'

export class ServicesServices {
  async create(data: Prisma.servicesCreateInput) {
    return db.services.create({ data })
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

  createContract(data: Prisma.service_contractsCreateInput) {
    return db.service_contracts.create({
      data: data,
    })
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

  createWorke(data: Prisma.services_workeCreateArgs) {
    return db.services_worke.create(data)
  }
  getOneWorke(
    where: Prisma.services_workeWhereInput,
    include: Prisma.services_workeInclude
  ) {
    return db.services_worke.findFirst({ where, include })
  }

  getAllWorke() {
    return db.services_worke.findMany()
  }

  updateWorke(
    where: Prisma.services_workeWhereUniqueInput,
    data: Prisma.services_workeUpdateInput
  ) {
    return db.services_worke.update({ where, data })
  }

  removeWorke(where: Prisma.services_workeWhereUniqueInput) {
    return db.services_worke.delete({ where })
  }
}
