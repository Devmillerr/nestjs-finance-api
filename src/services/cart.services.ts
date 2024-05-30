import cartMocks from '../utils/mocks/cart.json'

export class CartServices {

    create() {}

    getAll(){}

    get(id: number){
        return cartMocks.filter(r => r.id == id)
    }
}