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

  // Admin: danh sách + lọc
  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: danh sách ticket (lọc trạng thái)' })
  adminAll(@Query('status') status?: string) {
    return this.ticketsService.adminFindAll(status as any);
  }

  // Admin: phản hồi
  @Patch('admin/:id/reply')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: phản hồi ticket' })
  reply(@Param('id') id: string, @Body('reply') reply: string) {
    return this.ticketsService.reply(id, reply);
  }

  // Admin: đóng
  @Patch('admin/:id/close')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: đóng ticket' })
  close(@Param('id') id: string) {
    return this.ticketsService.close(id);
  }
}
