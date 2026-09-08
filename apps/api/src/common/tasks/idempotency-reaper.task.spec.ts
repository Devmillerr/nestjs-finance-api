import { IdempotencyStatus } from '@prisma/client';
import { IdempotencyReaperTask } from './idempotency-reaper.task';
import { PrismaService } from '../../prisma/prisma.service';

function createPrismaMock() {
  const idempotencyKey = {
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  };
  return {
    prisma: { idempotencyKey } as unknown as PrismaService,
    idempotencyKey,
  };
}

describe('IdempotencyReaperTask', () => {
  it('borra solo las keys PENDING más viejas que el umbral de staleness', async () => {
    const { prisma, idempotencyKey } = createPrismaMock();
    idempotencyKey.deleteMany.mockResolvedValue({ count: 3 });
    const task = new IdempotencyReaperTask(prisma);

    await task.reapStalePendingKeys();

    expect(idempotencyKey.deleteMany).toHaveBeenCalledWith({
      where: {
        status: IdempotencyStatus.PENDING,
        createdAt: { lt: expect.any(Date) },
      },
    });
    const cutoff =
      idempotencyKey.deleteMany.mock.calls[0][0].where.createdAt.lt;
    const minutesAgo = (Date.now() - cutoff.getTime()) / 60_000;
    expect(minutesAgo).toBeCloseTo(5, 0);
  });

  it('no lanza ni loguea como error cuando no hay keys huérfanas', async () => {
    const { prisma, idempotencyKey } = createPrismaMock();
    idempotencyKey.deleteMany.mockResolvedValue({ count: 0 });
    const task = new IdempotencyReaperTask(prisma);

    await expect(task.reapStalePendingKeys()).resolves.toBeUndefined();
  });
});
