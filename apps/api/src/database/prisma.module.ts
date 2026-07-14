// apps/api/src/database/prisma.module.ts
// Module cung cấp PrismaService toàn cục (global) cho toàn bộ ứng dụng.
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
