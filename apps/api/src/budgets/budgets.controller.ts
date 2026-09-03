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
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { QueryBudgetsDto } from './dto/query-budgets.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { OwnedResource } from '../common/decorators/owned-resource.decorator';
import { OwnershipGuard } from '../common/guards/ownership.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('budgets')
@ApiBearerAuth('access-token')
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(user.userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryBudgetsDto,
  ) {
    return this.budgetsService.findAll(user, query);
  }

  @UseGuards(OwnershipGuard)
  @OwnedResource({ model: 'budget', ownerField: 'clientId' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.budgetsService.findOne(id);
  }

  // A diferencia de Purchases, acá el dueño SÍ puede editar (un presupuesto
  // es una propuesta sin estado de pago que proteger). ADMIN/OWNER también
  // pueden, vía el propio OwnershipGuard.
  @UseGuards(OwnershipGuard)
  @OwnedResource({ model: 'budget', ownerField: 'clientId' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    return this.budgetsService.update(id, dto);
  }

  @UseGuards(OwnershipGuard)
  @OwnedResource({ model: 'budget', ownerField: 'clientId' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.budgetsService.softDelete(id);
  }
}
