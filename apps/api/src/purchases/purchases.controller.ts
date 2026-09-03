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
  UseInterceptors,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseStatusDto } from './dto/update-purchase-status.dto';
import { QueryPurchasesDto } from './dto/query-purchases.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { Roles } from '../common/decorators/roles.decorator';
import { OwnedResource } from '../common/decorators/owned-resource.decorator';
import { OwnershipGuard } from '../common/guards/ownership.guard';
import { IdempotencyInterceptor } from '../common/interceptors/idempotency.interceptor';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('purchases')
@ApiBearerAuth('access-token')
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  // Una compra siempre se crea a nombre de quien hace el request. No se
  // acepta clientId en el body -> imposible crear una compra a nombre de
  // otro usuario, ni siquiera por error del cliente HTTP.
  //
  // Idempotency-Key opcional: un doble submit (timeout, doble clic) con la
  // misma key nunca crea dos compras.
  @UseInterceptors(IdempotencyInterceptor)
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePurchaseDto,
  ) {
    return this.purchasesService.create(user.userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryPurchasesDto,
  ) {
    return this.purchasesService.findAll(user, query);
  }

  @UseGuards(OwnershipGuard)
  @OwnedResource({ model: 'purchase', ownerField: 'clientId' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchasesService.findOne(id);
  }

  // Cambiar el estado de pago es una operación de back-office -> solo
  // ADMIN/OWNER, nunca el propio cliente.
  @Roles('ADMIN', 'OWNER')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePurchaseStatusDto) {
    return this.purchasesService.updateStatus(id, dto);
  }

  @Roles('ADMIN', 'OWNER')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.purchasesService.softDelete(id);
  }
}
