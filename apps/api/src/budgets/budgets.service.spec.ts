import { BadRequestException } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { PrismaService } from '../prisma/prisma.service';

function createPrismaMock() {
  const tx = {
    product: { findMany: jest.fn() },
    budget: { create: jest.fn() },
    budgetProduct: { deleteMany: jest.fn(), createMany: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn((callback: any) => callback(tx)),
  };
  return { prisma: prisma as unknown as PrismaService, tx };
}

describe('BudgetsService', () => {
  describe('resolveLines (vía create)', () => {
    it('acepta una línea de ítem libre con title + priceCents', async () => {
      const { prisma, tx } = createPrismaMock();
      tx.budget.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'b1', ...data }),
      );

      const service = new BudgetsService(prisma);
      await service.create('client-1', {
        description: 'Presupuesto de prueba',
        lines: [{ title: 'Hosting anual', priceCents: 12000 }],
      } as any);

      const createCall = tx.budget.create.mock.calls[0][0];
      expect(createCall.data.lines.create[0]).toMatchObject({
        productId: null,
        title: 'Hosting anual',
        priceCents: 12000,
      });
    });

    it('rechaza una línea de ítem libre sin priceCents (falta el dato mínimo)', async () => {
      const { prisma, tx } = createPrismaMock();

      const service = new BudgetsService(prisma);
      await expect(
        service.create('client-1', {
          description: 'x',
          lines: [{ title: 'Sin precio' }],
        } as any),
      ).rejects.toThrow(BadRequestException);

      expect(tx.budget.create).not.toHaveBeenCalled();
    });

    it('hereda name/precio del producto de catálogo cuando la línea solo trae productId', async () => {
      const { prisma, tx } = createPrismaMock();
      tx.product.findMany.mockResolvedValue([
        {
          id: 'prod-1',
          name: 'Landing page',
          description: 'desc',
          priceCents: 50000,
        },
      ]);
      tx.budget.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'b1', ...data }),
      );

      const service = new BudgetsService(prisma);
      await service.create('client-1', {
        description: 'x',
        lines: [{ productId: 'prod-1' }],
      } as any);

      const createCall = tx.budget.create.mock.calls[0][0];
      expect(createCall.data.lines.create[0]).toMatchObject({
        productId: 'prod-1',
        title: 'Landing page',
        priceCents: 50000,
      });
    });

    it('rechaza un productId que no existe en el catálogo', async () => {
      const { prisma, tx } = createPrismaMock();
      tx.product.findMany.mockResolvedValue([]); // no encontró nada

      const service = new BudgetsService(prisma);
      await expect(
        service.create('client-1', {
          description: 'x',
          lines: [{ productId: 'prod-fantasma' }],
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
