import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../database/prisma.module';
import { EmailModule } from '../common/email/email.module';
import { OrdersModule } from '../orders/orders.module';
import { CustomProjectsModule } from '../custom-projects/custom-projects.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [ConfigModule, PrismaModule, EmailModule, OrdersModule, forwardRef(() => CustomProjectsModule)],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}