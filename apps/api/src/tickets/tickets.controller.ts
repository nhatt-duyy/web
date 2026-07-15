import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Controller('tickets')
@ApiTags('tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // Tạo ticket (user)
  @Post()
  @ApiOperation({ summary: 'Tạo yêu cầu hỗ trợ mới' })
  create(@Req() req: any, @Body() dto: CreateTicketDto) {
    return this.ticketsService.create(req.user.id, dto);
  }

  // Ticket của tôi
  @Get('my')
  @ApiOperation({ summary: 'Danh sách ticket của tôi' })
  mine(@Req() req: any) {
    return this.ticketsService.findAllForUser(req.user.id);
  }

  // Admin: danh sách + lọc (ADMIN + STAFF — STAFF thấy tất cả ticket)
  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Admin: danh sách ticket (lọc status/priority/assignedTo)' })
  adminAll(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.ticketsService.adminFindAll({
      status: status as any,
      priority: priority as any,
      assignedToId: assignedTo,
    });
  }

  // Admin/STAFF: cập nhật tổng quát (status/priority/assignedTo/reply)
  @Patch('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Admin: cập nhật ticket (gán/ưu tiên/phản hồi/trạng thái)' })
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.update(id, dto);
  }

  // Admin/STAFF: phản hồi nhanh
  @Patch('admin/:id/reply')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Admin: phản hồi ticket' })
  reply(@Param('id') id: string, @Body('reply') reply: string) {
    return this.ticketsService.reply(id, reply);
  }

  // Admin/STAFF: đóng
  @Patch('admin/:id/close')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Admin: đóng ticket' })
  close(@Param('id') id: string) {
    return this.ticketsService.close(id);
  }
}
