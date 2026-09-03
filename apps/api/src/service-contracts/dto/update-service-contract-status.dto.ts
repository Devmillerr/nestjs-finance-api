import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ContractStatus } from '@prisma/client';

export class UpdateServiceContractStatusDto {
  @IsEnum(ContractStatus)
  status: ContractStatus;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
