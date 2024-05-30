import productMocks from '../utils/mocks/product.json'

export class ProductServices {
    create() {}

    getAll() {}

    get(id: number){
        return productMocks.filter(r => r.id == id)
    }
}