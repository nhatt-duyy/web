import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { EmailModule } from '../common/email/email.module';
import { CouponsModule } from '../coupons/coupons.module';
import { AuditModule } from '../audit/audit.module';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [PrismaModule, EmailModule, CouponsModule, AuditModule],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}