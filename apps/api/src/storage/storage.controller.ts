import { Controller, Post, Body } from '@nestjs/common';
import { StorageService } from './storage.service';

/**
 * Controller để xử lý các thao tác liên quan đến lưu trữ (R2).
 * TODO(Task 2.x): Gắn @UseGuards(JwtAuthGuard, RolesGuard) + @Roles('ADMIN') khi auth module sẵn sàng.
 */
@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  /**
   * Tạo URL đã ký để tải file xuống (chỉ cho admin sau khi bảo mật được bật).
   * @param body chứa { key }: khóa của file trong bucket
   * @returns { url }: URL đã ký
   */
  @Post('presign-download')
  async presign(@Body() body: { key: string }) {
    const url = await this.storage.getSignedUrl(body.key);
    return { url };
  }
}