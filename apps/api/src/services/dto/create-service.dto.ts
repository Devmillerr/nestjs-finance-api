import { IsInt, IsString, IsUrl, Min, MinLength } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsInt()
  @Min(0)
  priceCents: number;

  @IsUrl()
  photoUrl: string;
}
