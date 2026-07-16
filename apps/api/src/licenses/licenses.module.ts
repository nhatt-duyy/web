import { Module } from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { LicensesController } from './licenses.controller';
import { LicensesPublicController } from './licenses-public.controller';
import { LicensesAdminController } from './licenses-admin.controller';
import { PrismaModule } from '../database/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, StorageModule, AuditModule],
  controllers: [LicensesController, LicensesPublicController, LicensesAdminController],
  providers: [LicensesService],
  exports: [LicensesService],
})
export class LicensesModule {}
