import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class BudgetLineDto {
  // Si se envía, la línea referencia un producto del catálogo (el service
  // puede usar su nombre/precio como base).
  @IsOptional()
  @IsString()
  productId?: string;

  // Si NO hay productId, title y priceCents son obligatorios (ítem libre,
  // ej. "Hosting anual" sin estar en el catálogo). Esta regla se valida en
  // el service, no acá, porque depende de la combinación de campos, no de
  // un campo aislado.
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;
}
