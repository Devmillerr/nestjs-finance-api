import userDMocks from '../utils/mocks/userD.json'

export class userDServices {
    create() {}

    getAll() {}

    get(id: number){
        return userDMocks.filter(r => r.id == id)
    }
}