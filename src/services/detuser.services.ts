import detuserMocks from '../utils/mocks/detuser.json';

export class DetuserServices {
  private detuser = detuserMocks;

  get(id: string) {
    return this.detuser.find(detuser => detuser.ud_id = id);
  }
}