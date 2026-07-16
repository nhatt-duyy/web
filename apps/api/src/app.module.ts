import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
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
  ],
})
export class AppModule {}