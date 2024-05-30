import { Request, Response } from 'express'; 
import { PagosServices } from '../services/pagos.services'; 

const pagosService = new PagosServices(); 

export class PagosController { 


  async getPago(req: Request, res: Response) { 
    const pagoId = +req.params.id; 
    const pago = pagosService.get(pagoId);
    res.json({ data: pago }); 
  }
}


