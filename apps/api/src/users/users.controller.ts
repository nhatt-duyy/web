import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { ChangeRoleDto } from './dto/change-role.dto';
import { UpdateActiveDto } from './dto/update-active.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Danh sách user: search + lọc + phân trang (chỉ ADMIN)
  @Get()
  @ApiOperation({ summary: 'Admin: danh sách user (search/lọc/phân trang)' })
  async findAll(
    @Query('email') email?: string,
    @Query('name') name?: string,
    @Query('role') role?: Role,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.findAll({
      email,
      name,
      role,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // Chi tiết user (chỉ ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Admin: chi tiết user (orders/licenses/tickets/reviews)' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // Đổi vai trò (chỉ ADMIN)
  @Patch(':id/role')
  @ApiOperation({ summary: 'Admin: đổi vai trò user' })
  async changeRole(
    @Param('id') id: string,
    @Body() dto: ChangeRoleDto,
    @Req() req: Request,
  ) {
    const actorId = (req.user as { id: string }).id;
    return this.usersService.changeRole(id, dto.role, actorId);
  }

  // Khóa/mở tài khoản (chỉ ADMIN)
  @Patch(':id/active')
  @ApiOperation({ summary: 'Admin: khóa/mở tài khoản user' })
  async setActive(
    @Param('id') id: string,
    @Body() dto: UpdateActiveDto,
    @Req() req: Request,
  ) {
    const actorId = (req.user as { id: string }).id;
    return this.usersService.setActive(id, dto.isActive, actorId);
  }

  // Đơn hàng của user (chỉ ADMIN)
  @Get(':id/orders')
  @ApiOperation({ summary: 'Admin: đơn hàng của user' })
  async userOrders(@Param('id') id: string) {
    return this.usersService.findUserOrders(id);
  }

  // License của user (chỉ ADMIN)
  @Get(':id/licenses')
  @ApiOperation({ summary: 'Admin: license của user' })
  async userLicenses(@Param('id') id: string) {
    return this.usersService.findUserLicenses(id);
  }
}
