import { Strategy } from 'passport-local'
import { UserServices } from '../database/users.services'
import { compareHash } from '../../utils/bcrypt'

const userservices = new UserServices()

export const credentials = new Strategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const getUser = await userservices.getOne({ email: email })
      if (!getUser) return done(null, false)
      if (!compareHash(password, getUser.password)) return done(null, false)
      return done(null, {
        id: getUser.id,
        email: getUser?.email,
        details: getUser?.userdetails,
      })
    } catch (error) {
      done(error)
    }
  }
)
