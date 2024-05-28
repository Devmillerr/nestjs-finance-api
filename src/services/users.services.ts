import userMocks from '../utils/mocks/user.json';

export class UserServices {
  create() {}

  getAll() {}

  get(id: number) {
    return userMocks.filter(r => r.id == id)[0];
  }
}
