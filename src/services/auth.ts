import passport from 'passport'
import { UserServices } from './database/users.services'
import { credentials } from './strategies/credentials'

const userservices = new UserServices()

passport.deserializeUser((id: string, done) => {
  userservices.getOne({ id }).then((user) => {
    done(null, {
      id,
      email: user?.email,
      ...user?.userdetails,
    })
  })
})

passport.serializeUser((user: any, done) => {
  done(null, user)
})

passport.use(credentials)

export default passport
