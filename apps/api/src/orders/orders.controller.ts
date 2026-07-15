import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from '@prisma/client';
import { Role } from '@prisma/client';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateOrderDto, @Req() req: Request) {
    const user = req.user as { id: string; role: string };
    const userId = user.id;
    return this.ordersService.create(dto, userId);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async findMy(@Req() req: Request) {
    const user = req.user as { id: string; role: string };
    const userId = user.id;
    return this.ordersService.findMyOrders(userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  async findAll(
    @Query('status') status?: OrderStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findAll({
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string; role: string };
    const userId = user.id;
    const role = user.role as Role;
    return this.ordersService.findOne(id, userId, role);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto.status);
  }
}