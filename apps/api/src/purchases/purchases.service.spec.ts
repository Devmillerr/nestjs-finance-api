import { BadRequestException } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock de $transaction que simplemente ejecuta el callback pasándole un
// "tx" que es el mismo mock de prisma -- suficiente para probar la lógica
// de negocio sin una base de datos real.
function createPrismaMock() {
  const tx = {
    product: { findMany: jest.fn() },
    purchase: { create: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn((callback: any) => callback(tx)),
    purchase: { findMany: jest.fn(), count: jest.fn(), findFirst: jest.fn() },
  };
  return { prisma: prisma as unknown as PrismaService, tx };
}

describe('PurchasesService', () => {
  describe('create', () => {
    it('calcula el total como suma de precio unitario x cantidad, usando el precio SNAPSHOT del producto', async () => {
      const { prisma, tx } = createPrismaMock();
      tx.product.findMany.mockResolvedValue([
        { id: 'prod-1', priceCents: 1000 },
        { id: 'prod-2', priceCents: 2500 },
      ]);
      tx.purchase.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'purchase-1', ...data }),
      );

      const service = new PurchasesService(prisma);
      const result = await service.create('client-1', {
        paymentMethod: 'PAYPAL',
        lines: [
          { productId: 'prod-1', quantity: 2 }, // 1000 * 2 = 2000
          { productId: 'prod-2', quantity: 1 }, // 2500 * 1 = 2500
        ],
      } as any);

      expect((result as any).totalCents).toBe(4500);
      expect((result as any).clientId).toBe('client-1');
    });

    it('rechaza la compra completa si algún producto no existe (nada se crea a medias)', async () => {
      const { prisma, tx } = createPrismaMock();
      // Solo devuelve 1 de los 2 productos pedidos -> uno no existe.
      tx.product.findMany.mockResolvedValue([
        { id: 'prod-1', priceCents: 1000 },
      ]);

      const service = new PurchasesService(prisma);

      await expect(
        service.create('client-1', {
          paymentMethod: 'PAYPAL',
          lines: [
            { productId: 'prod-1', quantity: 1 },
            { productId: 'prod-inexistente', quantity: 1 },
          ],
        } as any),
      ).rejects.toThrow(BadRequestException);

      expect(tx.purchase.create).not.toHaveBeenCalled();
    });

    it('el precio de la línea es el snapshot al momento de comprar, no una referencia al producto', async () => {
      const { prisma, tx } = createPrismaMock();
      tx.product.findMany.mockResolvedValue([
        { id: 'prod-1', priceCents: 999 },
      ]);
      tx.purchase.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'purchase-1', ...data }),
      );

      const service = new PurchasesService(prisma);
      await service.create('client-1', {
        paymentMethod: 'STRIPE',
        lines: [{ productId: 'prod-1', quantity: 3 }],
      } as any);

      const createCall = tx.purchase.create.mock.calls[0][0];
      expect(createCall.data.lines.create[0].unitPriceCents).toBe(999);
      expect(createCall.data.lines.create[0].quantity).toBe(3);
    });
  });
});
