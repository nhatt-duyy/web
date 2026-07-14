import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { EmailModule } from '../common/email/email.module';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}