import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryInvoicesDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  clientId?: string;
}
