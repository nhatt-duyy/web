import { Controller, Get, Post, Param, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LicensesService } from './licenses.service';

@Controller('licenses')
@UseGuards(JwtAuthGuard)
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  // Danh sách license của tôi
  @Get()
  findAll(@Req() req: any) {
    return this.licensesService.findAllForUser(req.user.id);
  }

  // Chi tiết 1 license
  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.licensesService.findOneForUser(req.user.id, id);
  }

  // Tạo link tải file source (kiểm tra giới hạn)
  @Post(':id/download')
  @Throttle({ default: { ttl: 60000, limit: 10 } }) // 10 lượt tải/phút — chống spam link
  download(@Req() req: any, @Param('id') id: string) {
    return this.licensesService.download(req.user.id, id);
  }

  // Stream file source đã giải mã (Phase 5 — M2). Chỉ chủ license mới tải được.
  @Get(':id/stream')
  async stream(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const buf = await this.licensesService.streamDecrypted(req.user.id, id);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="source-${id}.zip"`);
    res.send(buf);
  }
}
