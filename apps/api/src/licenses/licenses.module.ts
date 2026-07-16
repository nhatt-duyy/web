import { Module } from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { LicensesController } from './licenses.controller';
import { LicensesPublicController } from './licenses-public.controller';
import { LicensesAdminController } from './licenses-admin.controller';
import { PrismaModule } from '../database/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { EncryptionModule } from '../common/encryption/encryption.module';
import { WatermarkModule } from '../common/watermark/watermark.module';

@Module({
  imports: [PrismaModule, StorageModule, AuditModule, EncryptionModule, WatermarkModule],
  controllers: [LicensesController, LicensesPublicController, LicensesAdminController],
  providers: [LicensesService],
  exports: [LicensesService],
})
export class LicensesModule {}
