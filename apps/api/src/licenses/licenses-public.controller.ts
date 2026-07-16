import { Controller, Post, Body } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { LicensesService } from './licenses.service';

/**
 * Controller công khai cho license key (KHÔNG dùng JwtAuthGuard).
 * Dành cho client/3rd-party tự verify key mà không cần đăng nhập.
 */
@Controller('licenses')
export class LicensesPublicController {
  constructor(private readonly licensesService: LicensesService) {}

  // Xác minh license key (public — client/3rd-party tự verify)
  @Post('verify')
  @SkipThrottle() // verify công khai, không bị giới hạn tần suất
  async verify(@Body('key') key: string) {
    return this.licensesService.verifyKey(key);
  }
}
