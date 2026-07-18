// apps/api/src/health/health.controller.ts
// Health check endpoint dùng cho Docker HEALTHCHECK và UptimeRobot.
// KHÔNG động đến module nghiệp vụ khác — chỉ trả status đơn giản.
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
