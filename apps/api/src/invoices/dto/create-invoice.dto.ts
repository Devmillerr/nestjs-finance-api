import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';
import { InvoiceLineDto } from './invoice-line.dto';
import { InvoiceChargeDto } from './invoice-charge.dto';

export class CreateInvoiceDto {
  // La factura la emite el negocio a nombre de un cliente -> clientId sí
  // viaja en el body (a diferencia de Purchases). El endpoint está
  // restringido a ADMIN/OWNER en el controller.
  @IsString()
  clientId: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsDateString()
  expiration: string;

  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  @ArrayMinSize(1)
  lines: InvoiceLineDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceChargeDto)
  charges?: InvoiceChargeDto[];
}
