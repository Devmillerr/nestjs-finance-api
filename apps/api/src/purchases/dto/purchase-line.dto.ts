import { IsInt, IsString, Min } from 'class-validator';

export class PurchaseLineDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
