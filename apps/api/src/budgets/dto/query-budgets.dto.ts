import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryBudgetsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  clientId?: string;
}
