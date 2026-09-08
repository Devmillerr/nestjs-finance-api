import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

function createPrismaMock() {
  const tx = {
    user: { findUnique: jest.fn() },
    product: { findMany: jest.fn().mockResolvedValue([]) },
    service: { findMany: jest.fn().mockResolvedValue([]) },
    serviceContract: { findMany: jest.fn().mockResolvedValue([]) },
    invoice: { create: jest.fn() },
  };
  const invoice = {
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    findFirst: jest.fn(),
    update: jest.fn(),
  };
  const invoiceCharge = { create: jest.fn() };
  const prisma = {
    $transaction: jest.fn((arg: unknown) =>
      typeof arg === 'function' ? (arg as any)(tx) : Promise.all(arg as any[]),
    ),
    invoice,
    invoiceCharge,
  };
  return {
    prisma: prisma as unknown as PrismaService,
    tx,
    invoice,
    invoiceCharge,
  };
}

const OWNER_USER: AuthenticatedUser = {
  userId: 'owner-1',
  email: 'o@x.com',
  role: 'OWNER',
  permissions: [],
};
const REGULAR_USER: AuthenticatedUser = {
  userId: 'user-1',
  email: 'u@x.com',
  role: 'USER',
  permissions: [],
};

describe('InvoicesService', () => {
  describe('create — resolveLines + computeTotals (vía tx)', () => {
    it('rechaza si el cliente no existe, sin llegar a crear la factura', async () => {
      const { prisma, tx } = createPrismaMock();
      tx.user.findUnique.mockResolvedValue(null);
      const service = new InvoicesService(prisma);

      await expect(
        service.create({
          clientId: 'no-existe',
          paymentMethod: 'PAYPAL',
          expiration: '2026-12-01',
          lines: [{ name: 'x', priceCents: 100 }],
        } as any),
      ).rejects.toThrow(BadRequestException);
      expect(tx.invoice.create).not.toHaveBeenCalled();
    });

    it('rechaza una línea que referencia más de un producto/servicio/contrato a la vez', async () => {
      const { prisma, tx } = createPrismaMock();
      tx.user.findUnique.mockResolvedValue({ id: 'client-1' });

      const service = new InvoicesService(prisma);
      await expect(
        service.create({
          clientId: 'client-1',
          paymentMethod: 'PAYPAL',
          expiration: '2026-12-01',
          lines: [{ productId: 'p1', serviceId: 's1' }],
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza un productId que no existe en el catálogo', async () => {
      const { prisma, tx } = createPrismaMock();
      tx.user.findUnique.mockResolvedValue({ id: 'client-1' });
      tx.product.findMany.mockResolvedValue([]);

      const service = new InvoicesService(prisma);
      await expect(
        service.create({
          clientId: 'client-1',
          paymentMethod: 'PAYPAL',
          expiration: '2026-12-01',
          lines: [{ productId: 'fantasma' }],
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza un ítem libre sin name/priceCents (falta el mínimo)', async () => {
      const { prisma, tx } = createPrismaMock();
      tx.user.findUnique.mockResolvedValue({ id: 'client-1' });

      const service = new InvoicesService(prisma);
      await expect(
        service.create({
          clientId: 'client-1',
          paymentMethod: 'PAYPAL',
          expiration: '2026-12-01',
          lines: [{ description: 'sin nombre ni precio' }],
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('hereda name/priceCents del producto de catálogo cuando la línea solo trae productId', async () => {
      const { prisma, tx } = createPrismaMock();
      tx.user.findUnique.mockResolvedValue({ id: 'client-1' });
      tx.product.findMany.mockResolvedValue([
        {
          id: 'prod-1',
          name: 'Hosting',
          description: 'desc',
          priceCents: 5000,
        },
      ]);
      tx.invoice.create.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'inv-1',
          lines: data.lines.create,
          charges: data.charges?.create ?? [],
        }),
      );

      const service = new InvoicesService(prisma);
      await service.create({
        clientId: 'client-1',
        paymentMethod: 'PAYPAL',
        expiration: '2026-12-01',
        lines: [{ productId: 'prod-1' }],
      } as any);

      const createCall = tx.invoice.create.mock.calls[0][0];
      expect(createCall.data.lines.create[0]).toMatchObject({
        productId: 'prod-1',
        name: 'Hosting',
        priceCents: 5000,
      });
    });

    it('calcula subtotalCents/chargesCents/totalCents, aplicando DISCOUNT en negativo', async () => {
      const { prisma, tx } = createPrismaMock();
      tx.user.findUnique.mockResolvedValue({ id: 'client-1' });
      tx.invoice.create.mockResolvedValue({
        id: 'inv-1',
        lines: [{ priceCents: 10_000 }, { priceCents: 5_000 }],
        charges: [
          { type: 'TAX', amountCents: 1_000 },
          { type: 'DISCOUNT', amountCents: 2_000 },
        ],
      });

      const service = new InvoicesService(prisma);
      const result = await service.create({
        clientId: 'client-1',
        paymentMethod: 'PAYPAL',
        expiration: '2026-12-01',
        lines: [
          { name: 'a', priceCents: 10_000 },
          { name: 'b', priceCents: 5_000 },
        ],
        charges: [
          { type: 'TAX', amountCents: 1_000 },
          { type: 'DISCOUNT', amountCents: 2_000 },
        ],
      } as any);

      expect(result).toMatchObject({
        subtotalCents: 15_000,
        chargesCents: -1_000, // +1000 (TAX) - 2000 (DISCOUNT)
        totalCents: 14_000,
      });
    });
  });

  describe('findAll — visibilidad por rol', () => {
    it('un USER regular solo consulta sus propias facturas (clientId=userId)', async () => {
      const { prisma, invoice } = createPrismaMock();
      const service = new InvoicesService(prisma);

      await service.findAll(REGULAR_USER, { skip: 0, limit: 20 } as any);

      expect(invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clientId: 'user-1',
            deletedAt: null,
          }),
        }),
      );
    });

    it('ADMIN/OWNER pueden consultar el clientId que pasen por query (o todas)', async () => {
      const { prisma, invoice } = createPrismaMock();
      const service = new InvoicesService(prisma);

      await service.findAll(OWNER_USER, {
        skip: 0,
        limit: 20,
        clientId: 'otro-cliente',
      } as any);

      expect(invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ clientId: 'otro-cliente' }),
        }),
      );
    });
  });

  describe('findOne / updateStatus / addCharge / softDelete', () => {
    it('findOne: 404 si no existe (o está soft-deleted)', async () => {
      const { prisma, invoice } = createPrismaMock();
      invoice.findFirst.mockResolvedValue(null);
      const service = new InvoicesService(prisma);

      await expect(service.findOne('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('findOne: agrega los totales calculados a la factura encontrada', async () => {
      const { prisma, invoice } = createPrismaMock();
      invoice.findFirst.mockResolvedValue({
        id: 'inv-1',
        lines: [{ priceCents: 1_000 }],
        charges: [],
      });
      const service = new InvoicesService(prisma);

      const result = await service.findOne('inv-1');

      expect(result).toMatchObject({ subtotalCents: 1_000, totalCents: 1_000 });
    });

    it('updateStatus: 404 si la factura no existe, nunca llega al update', async () => {
      const { prisma, invoice } = createPrismaMock();
      invoice.findFirst.mockResolvedValue(null);
      const service = new InvoicesService(prisma);

      await expect(
        service.updateStatus('no-existe', {
          paymentStatus: 'COMPLETED',
        } as any),
      ).rejects.toThrow(NotFoundException);
      expect(invoice.update).not.toHaveBeenCalled();
    });

    it('addCharge: 404 si la factura no existe', async () => {
      const { prisma, invoice, invoiceCharge } = createPrismaMock();
      invoice.findFirst.mockResolvedValue(null);
      const service = new InvoicesService(prisma);

      await expect(
        service.addCharge('no-existe', {
          type: 'TAX',
          amountCents: 100,
        } as any),
      ).rejects.toThrow(NotFoundException);
      expect(invoiceCharge.create).not.toHaveBeenCalled();
    });

    it('softDelete: marca deletedAt en vez de borrar la fila', async () => {
      const { prisma, invoice } = createPrismaMock();
      invoice.findFirst.mockResolvedValue({
        id: 'inv-1',
        lines: [],
        charges: [],
      });
      const service = new InvoicesService(prisma);

      await service.softDelete('inv-1');

      expect(invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
