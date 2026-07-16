import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, ProjectStatus } from '@prisma/client';
import { CustomProjectsService } from './custom-projects.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('custom-projects')
export class CustomProjectsController {
  constructor(private readonly service: CustomProjectsService) {}

  // ===== Public: yêu cầu báo giá =====
  @Post('requests')
  async createRequest(@Body() dto: CreateRequestDto, @Req() req: any) {
    const userId = req.user?.id; // undefined nếu chưa login (cho phép khách vãng lai)
    return this.service.createRequest(dto, userId);
  }

  // ===== Public: portfolio =====
  @Get()
  async listShowcase(
    @Query('showcase') showcase?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    if (showcase === 'true') {
      return this.service.findShowcase({ type, limit: limit ? Number(limit) : 12 });
    }
    // Mặc định trả board (yêu cầu admin/STAFF qua guard bên dưới)
    throw new ForbiddenException('Cần đăng nhập admin để xem danh sách dự án');
  }

  @Get('slug/:slug')
  async showcaseDetail(@Param('slug') slug: string) {
    return this.service.findShowcaseDetail(slug);
  }

  // ===== Admin/STAFF: board + quản lý =====
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get('board')
  async board(
    @Query('status') status?: ProjectStatus,
    @Query('assigneeId') assigneeId?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAllForBoard({ status, assigneeId, search });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /** Dashboard "Dự án của tôi" — chỉ user đã login, trả dự án của chính họ. */
  @UseGuards(JwtAuthGuard)
  @Get('my')
  async my(@Req() req: any) {
    return this.service.findMyForBoard(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.service.updateProject(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Post(':id/milestones')
  async addMilestone(@Param('id') id: string, @Body() dto: CreateMilestoneDto) {
    return this.service.addMilestone(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Post(':id/milestones/generate')
  async generateMilestones(@Param('id') id: string) {
    return this.service.generateDefaultMilestones(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get(':id/milestones')
  async milestones(@Param('id') id: string) {
    return this.service.getMilestones(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get(':id/debt')
  async debt(@Param('id') id: string) {
    return this.service.getDebtSummary(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get(':id/messages')
  async messages(@Param('id') id: string) {
    return this.service.getMessages(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Post(':id/messages')
  async sendMessageStaff(@Param('id') id: string, @Body() dto: SendMessageDto, @Req() req: any) {
    return this.service.sendMessage(id, req.user.id, true, dto);
  }

  // ===== Khách (chủ dự án) hoặc admin =====
  @UseGuards(JwtAuthGuard)
  @Post(':id/milestones/:mid/pay-link')
  async payLink(@Param('id') id: string, @Param('mid') mid: string, @Req() req: any) {
    return this.service.createMilestonePayLink(id, mid, {
      id: req.user.id,
      email: req.user.email,
    });
  }
}
