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
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { InvoiceChargeDto } from './dto/invoice-charge.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { Roles } from '../common/decorators/roles.decorator';
import { OwnedResource } from '../common/decorators/owned-resource.decorator';
import { OwnershipGuard } from '../common/guards/ownership.guard';
import { IdempotencyInterceptor } from '../common/interceptors/idempotency.interceptor';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('invoices')
@ApiBearerAuth('access-token')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  // Emitir una factura es una operación de back-office -> solo ADMIN/OWNER.
  // El cliente nunca se factura a sí mismo.
  //
  // Idempotency-Key opcional: emitir la misma factura dos veces por un
  // doble submit del back-office es exactamente el tipo de bug que esto
  // previene.
  @Roles('ADMIN', 'OWNER')
  @UseInterceptors(IdempotencyInterceptor)
  @Post()
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryInvoicesDto,
  ) {
    return this.invoicesService.findAll(user, query);
  }

  // El cliente SÍ puede ver su propia factura (es su documento), solo
  // lectura -> por eso este es el único endpoint de Invoices con
  // OwnershipGuard en vez de @Roles.
  @UseGuards(OwnershipGuard)
  @OwnedResource({ model: 'invoice', ownerField: 'clientId' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Roles('ADMIN', 'OWNER')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateInvoiceStatusDto) {
    return this.invoicesService.updateStatus(id, dto);
  }

  @Roles('ADMIN', 'OWNER')
  @Post(':id/charges')
  addCharge(@Param('id') id: string, @Body() dto: InvoiceChargeDto) {
    return this.invoicesService.addCharge(id, dto);
  }

  @Roles('ADMIN', 'OWNER')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.invoicesService.softDelete(id);
  }
}
