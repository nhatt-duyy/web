import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Module({
  imports: [PrismaModule],
  providers: [AuditService],
  exports: [AuditService],
  controllers: [AuditController],
})
export class AuditModule {}
