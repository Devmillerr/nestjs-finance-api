import { IsEnum } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class UpdatePurchaseStatusDto {
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;
}
