import { Controller, Patch, Param, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { LicensesService } from './licenses.service';

@Controller('admin/licenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class LicensesAdminController {
  constructor(private readonly licensesService: LicensesService) {}

  // Thu hồi 1 license (admin) — chặn user tải source đã mua nếu bị lộ key
  @Patch(':id/revoke')
  async revoke(@Req() req: Request & { user: { id: string } }, @Param('id') id: string) {
    return this.licensesService.revoke(id, req.user.id);
  }
}
