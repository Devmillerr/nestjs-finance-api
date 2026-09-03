import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class InvoiceLineDto {
  // Como mucho UNA de estas tres referencias por línea. La exclusividad
  // mutua se valida en el service (depende de la combinación de campos).
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  serviceContractId?: string;

  // Si no hay ninguna referencia, name y priceCents son obligatorios
  // (ítem libre, ej. "Ajuste manual"). Si hay referencia, sirven para
  // sobreescribir el nombre/precio snapshot si hace falta.
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;
}
