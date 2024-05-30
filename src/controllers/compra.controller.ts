import { Response, Request } from 'express';
import { CompraService } from '../services/compra.services'; 

const compraService = new CompraService();

export class CompraController {
  getCompraById(req: Request, res: Response): void {
    const compraId = +req.params.id; 
    const compra = compraService.getCompraById(compraId);
    if (compra) {
      res.json({ data: compra });
    } else {
      res.status(404).json({ message: 'Compra not found' });
    }
  }

  getComprasByUserId(req: Request, res: Response): void {
    const userId = +req.params.userId; 
    const compras = compraService.getComprasByUserId(userId);
    res.json({ data: compras });
  }
}
