import { Type } from 'class-transformer';
import { ArrayMinSize, IsEnum, ValidateNested } from 'class-validator';
import { PaymentMethod } from '@prisma/client';
import { PurchaseLineDto } from './purchase-line.dto';

export class CreatePurchaseDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ValidateNested({ each: true })
  @Type(() => PurchaseLineDto)
  @ArrayMinSize(1)
  lines: PurchaseLineDto[];
}
