import { IsEnum, IsInt, Min } from 'class-validator';
import { ChargeType } from '@prisma/client';

export class InvoiceChargeDto {
  @IsEnum(ChargeType)
  type: ChargeType;

  // Siempre positivo; el signo con el que afecta el total depende del
  // `type` (DISCOUNT resta, TAX/OTHER suman) — se resuelve en el service,
  // no acá, para no duplicar esa regla en cada DTO que use cargos.
  @IsInt()
  @Min(0)
  amountCents: number;
}
