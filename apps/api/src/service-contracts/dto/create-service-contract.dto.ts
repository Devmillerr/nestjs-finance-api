import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateServiceContractDto {
  // El negocio crea el contrato a nombre de un cliente -> clientId viaja en
  // el body, igual que en Invoices. Restringido a ADMIN/OWNER en el
  // controller.
  @IsString()
  clientId: string;

  // Opcional: un contrato puede referenciar un servicio del catálogo
  // (hereda name/priceCents si no se sobreescriben) o ser un contrato a
  // medida sin entrada en el catálogo.
  @IsOptional()
  @IsString()
  serviceId?: string;

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

  @IsOptional()
  @IsString()
  notes?: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
