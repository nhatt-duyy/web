import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  // Tổng quan — ADMIN + STAFF. Chỉ ADMIN nhận trường totalRevenue (quyết định 2.4).
  @Get('overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  async overview(@Req() req: Request) {
    const role = (req.user as { role?: Role })?.role;
    return this.statsService.overview(role === Role.ADMIN);
  }

  // Time-series doanh thu 30 ngày — chỉ ADMIN.
  @Get('revenue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async revenue(@Query('days') days?: string) {
    const parsed = days ? Number(days) : 30;
    return this.statsService.revenue(parsed);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getStats() {
    return this.statsService.getStats();
  }
}
