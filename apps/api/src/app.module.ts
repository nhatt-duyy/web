import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './database/prisma.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './common/email/email.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { StatsModule } from './stats/stats.module';
import { SearchModule } from './search/search.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CouponsModule } from './coupons/coupons.module';
import { LicensesModule } from './licenses/licenses.module';
import { TicketsModule } from './tickets/tickets.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { CustomProjectsModule } from './custom-projects/custom-projects.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { ttl: 60000, limit: 100 }, // 100 req/phút (mặc định chung, thoáng)
    ]),
    PrismaModule,
    StorageModule,
    AuthModule,
    EmailModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    PaymentsModule,
    StatsModule,
    SearchModule,
    ReviewsModule,
    CouponsModule,
    LicensesModule,
    TicketsModule,
    UsersModule,
    PostsModule,
    CustomProjectsModule,
    AuditModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}