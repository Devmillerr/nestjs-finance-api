import bcrypt from 'bcrypt'

export const createHash = (text: string) => {
  const salt = bcrypt.genSaltSync(10)
  return bcrypt.hashSync(text, salt)
}
export const compareHash = (text: string, hash: string) => {
  return bcrypt.compareSync(text, hash)
}
