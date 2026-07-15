import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [totalProducts, totalOrders, totalUsers, paidOrders] =
      await this.prisma.$transaction([
        this.prisma.product.count(),
        this.prisma.order.count(),
        this.prisma.user.count(),
        this.prisma.order.findMany({
          where: { status: 'PAID' },
          select: { total: true },
        }),
      ]);

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

    return { totalProducts, totalOrders, totalUsers, totalRevenue };
  }
}
