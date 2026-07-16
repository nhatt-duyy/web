import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { PaymentsModule } from '../payments/payments.module';
import { EmailModule } from '../common/email/email.module';
import { CustomProjectsService } from './custom-projects.service';
import { CustomProjectsController } from './custom-projects.controller';

@Module({
  imports: [PrismaModule, EmailModule, forwardRef(() => PaymentsModule)],
  providers: [CustomProjectsService],
  controllers: [CustomProjectsController],
  exports: [CustomProjectsService],
})
export class CustomProjectsModule {}
