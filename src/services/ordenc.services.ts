import OcMocks from '../utils/mocks/ordenC.json'

export class ocServices {

    create() {}

    getAll() {}

    get(id: number){
        return OcMocks.filter(r => r.id == id)
    }
}