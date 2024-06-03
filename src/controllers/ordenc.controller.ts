import { Response, Request } from "express"
import { ocServices } from '../services/ordenc.services'
const oCServices = new ocServices()

export class ocController {
    async getOc(req: Request, res: Response){
        const OcID = req.params.id;
        const getOc = await oCServices.get(+OcID)
        res.json({
            data: getOc
        })
    }
}