import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ServiceContractsService } from './service-contracts.service';
import { CreateServiceContractDto } from './dto/create-service-contract.dto';
import { UpdateServiceContractStatusDto } from './dto/update-service-contract-status.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { QueryServiceContractsDto } from './dto/query-service-contracts.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { Roles } from '../common/decorators/roles.decorator';
import { OwnedResource } from '../common/decorators/owned-resource.decorator';
import { OwnershipGuard } from '../common/guards/ownership.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('service-contracts')
@ApiBearerAuth('access-token')
@Controller('service-contracts')
export class ServiceContractsController {
  constructor(private readonly contractsService: ServiceContractsService) {}

  @Roles('ADMIN', 'OWNER')
  @Post()
  create(@Body() dto: CreateServiceContractDto) {
    return this.contractsService.create(dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryServiceContractsDto,
  ) {
    return this.contractsService.findAll(user, query);
  }

  @UseGuards(OwnershipGuard)
  @OwnedResource({ model: 'serviceContract', ownerField: 'clientId' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Roles('ADMIN', 'OWNER')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateServiceContractStatusDto,
  ) {
    return this.contractsService.updateStatus(id, dto);
  }

  @Roles('ADMIN', 'OWNER')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.contractsService.softDelete(id);
  }

  @Roles('ADMIN', 'OWNER')
  @Post(':id/assignments')
  addAssignment(@Param('id') id: string, @Body() dto: CreateAssignmentDto) {
    return this.contractsService.addAssignment(id, dto);
  }

  @Roles('ADMIN', 'OWNER')
  @Delete(':id/assignments/:assignmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAssignment(
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.contractsService.removeAssignment(id, assignmentId);
  }
}
