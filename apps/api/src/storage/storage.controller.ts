import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  // URL đã ký để tải file xuống (chỉ admin).
  @Post('presign-download')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async presignDownload(@Body() body: { key: string }) {
    const url = await this.storage.getSignedUrl(body.key);
    return { url };
  }

  // Tạo URL đã ký (PUT) để admin upload file trực tiếp lên R2 từ trình duyệt.
  @Post('presign-upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async presignUpload(@Body() body: { fileName: string; contentType: string }) {
    const key = `products/${Date.now()}-${body.fileName}`;
    const url = await this.storage.getPresignedUploadUrl(key, body.contentType);
    const publicUrl = process.env.R2_PUBLIC_URL ? `${process.env.R2_PUBLIC_URL}/${key}` : undefined;
    return { url, key, publicUrl };
  }
}
