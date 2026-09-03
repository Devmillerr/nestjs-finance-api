import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDetailsDto } from './dto/update-user-details.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { OwnedResource } from '../common/decorators/owned-resource.decorator';
import { OwnershipGuard } from '../common/guards/ownership.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Solo ADMIN/OWNER pueden listar todos los usuarios. RolesGuard (global)
  // ya bloquea esto para el resto.
  @Roles('ADMIN', 'OWNER')
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  // Un usuario puede ver su propio perfil; ADMIN/OWNER pueden ver cualquiera.
  // OwnershipGuard resuelve esto comparando params.id contra el propio id
  // del usuario (ownerField: 'id' -> auto-propiedad).
  @UseGuards(OwnershipGuard)
  @OwnedResource({ model: 'user', ownerField: 'id' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(OwnershipGuard)
  @OwnedResource({ model: 'user', ownerField: 'id' })
  @Patch(':id/details')
  updateDetails(@Param('id') id: string, @Body() dto: UpdateUserDetailsDto) {
    return this.usersService.updateDetails(id, dto);
  }

  @Roles('ADMIN', 'OWNER')
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }
}
