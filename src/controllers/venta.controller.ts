import { Request, Response } from 'express';
import { VentaService } from '../services/database/venta.services';

const ventaService = new VentaService();

export class VentaController {
  getVentaById(req: Request, res: Response): void {
    const ventaId = +req.params.id;
    const venta = ventaService.getVentasById(ventaId);
    if (venta) {
      res.json({ data: venta });
    } else {
      res.status(404).json({ message: 'Venta not found' });
    }
  }

  getVentasByUserId(req: Request, res: Response): void {
    const userId = +req.params.userId;
    const ventas = ventaService.getVentasByUserId(userId);
    res.json({ data: ventas });
  }
}
