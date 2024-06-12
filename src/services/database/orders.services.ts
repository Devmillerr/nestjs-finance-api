import { db } from '../db'
export class OrderServices {

 create() {}

 getAll() {}

 get(id: string){
  return db.users.findUnique({
    where: { id }, 
    include: {
        userdetails: true,
    }
  })
 }

}