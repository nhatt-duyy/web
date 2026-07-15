import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;

// KPI nâng cao cho Dashboard admin (Mục 2 Phase 3).
@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  private startOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  // Giữ lại cho tương thích ngược với GET /stats (chỉ ADMIN).
  async getStats() {
    const [totalProducts, totalOrders, totalUsers, rev] = await this.prisma.$transaction([
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.user.count(),
      this.prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { total: true } }),
    ]);
    return { totalProducts, totalOrders, totalUsers, totalRevenue: rev._sum.total ?? 0 };
  }

  // Tổng quan: chỉ số + breakdown trạng thái đơn + top sản phẩm + đơn gần nhất.
  // includeRevenue=true chỉ dành ADMIN (theo quyết định 2.4 — STAFF không xem revenue).
  async overview(includeRevenue: boolean) {
    const since30 = new Date(Date.now() - 30 * DAY_MS);

    const [totalProducts, totalOrders, totalUsers, statusRows, topRows, recentOrders, newUsersCount] =
      await this.prisma.$transaction([
        this.prisma.product.count(),
        this.prisma.order.count(),
        this.prisma.user.count(),
        // Breakdown trạng thái đơn — groupBy 1 query, không N+1.
        this.prisma.order.groupBy({ by: ['status'], orderBy: { status: 'asc' }, _count: true }),
        // Top sản phẩm theo số lượng bán — aggregate trên OrderItem.
        this.prisma.orderItem.groupBy({
          by: ['productId'],
          _sum: { qty: true, price: true },
          orderBy: { _sum: { qty: 'desc' } },
          take: 5,
        }),
        this.prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, total: true, status: true, createdAt: true, user: { select: { email: true } } },
        }),
        this.prisma.user.count({ where: { createdAt: { gte: since30 } } }),
      ]);

    const orderStatusBreakdown = statusRows.map((r) => ({ status: r.status, count: r._count }));

    // Lấy title sản phẩm cho topRows trong 1 query (tránh N+1).
    const productIds = topRows.map((r) => r.productId);
    const products = productIds.length
      ? await this.prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, title: true } })
      : [];
    const titleById = new Map(products.map((p) => [p.id, p.title]));
    const topProducts = topRows.map((r) => ({
      id: r.productId,
      title: titleById.get(r.productId) ?? '—',
      qty: r._sum?.qty ?? 0,
      revenue: r._sum?.price ?? 0,
    }));

    const result: Record<string, unknown> = {
      totalProducts,
      totalOrders,
      totalUsers,
      newUsers: newUsersCount,
      orderStatusBreakdown,
      topProducts,
      recentOrders,
    };

    if (includeRevenue) {
      const rev = await this.prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { total: true } });
      result.totalRevenue = rev._sum.total ?? 0;
    }
    return result;
  }

  // Time-series doanh thu theo ngày (đơn PAID) trong N ngày gần nhất.
  async revenue(days = 30) {
    const safeDays = Number.isFinite(days) && days > 0 && days <= 365 ? Math.floor(days) : 30;
    const since = new Date(Date.now() - safeDays * DAY_MS);
    const orders = await this.prisma.order.findMany({
      where: { status: 'PAID', createdAt: { gte: since } },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: 'asc' },
    });

    const byDate = new Map<string, number>();
    for (const o of orders) {
      const key = this.startOfDay(o.createdAt).toISOString().slice(0, 10);
      byDate.set(key, (byDate.get(key) ?? 0) + o.total);
    }

    // Điền đủ N ngày (kể cả ngày 0 doanh thu) để biểu đồ liền mạch.
    const series: { date: string; revenue: number }[] = [];
    for (let i = safeDays - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY_MS);
      const key = this.startOfDay(d).toISOString().slice(0, 10);
      series.push({ date: key, revenue: byDate.get(key) ?? 0 });
    }
    return { series, days: safeDays };
  }
}
