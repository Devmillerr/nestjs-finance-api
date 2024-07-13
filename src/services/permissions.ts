import { permissionTypes } from '@prisma/client'
import { db } from './db'

export const hasPermission = (
  userId: string,
  permissionName: permissionTypes
) => {
  return db.user_permissions.findFirst({
    where: {
      userId,
      permission: {
        name: permissionName,
      },
    },
  })
}
