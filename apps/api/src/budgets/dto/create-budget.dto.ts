import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { BudgetLineDto } from './budget-line.dto';

export class CreateBudgetDto {
  @IsString()
  @MinLength(1)
  description: string;

  @ValidateNested({ each: true })
  @Type(() => BudgetLineDto)
  @ArrayMinSize(1)
  lines: BudgetLineDto[];
}
