import { IsEnum } from 'class-validator';
import { PermissionName } from '@prisma/client';

export class GrantPermissionDto {
  @IsEnum(PermissionName)
  permission: PermissionName;
}
