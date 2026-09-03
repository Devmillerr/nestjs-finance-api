import {
  IsEnum,
  IsInt,
  IsString,
  IsUrl,
  Min,
  MinLength,
} from 'class-validator';
import { ProductType } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  description: string;

  // Enteros en centavos, ver ARCHITECTURE.md. 1999 = $19.99.
  @IsInt()
  @Min(0)
  priceCents: number;

  @IsUrl()
  photoUrl: string;

  @IsEnum(ProductType)
  type: ProductType;
}
