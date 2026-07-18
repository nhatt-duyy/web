import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { PrismaService } from '../database/prisma.service';

describe('StatsService', () => {
  let service: StatsService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        {
          provide: PrismaService,
          useValue: {
            product: { count: jest.fn(), findMany: jest.fn() },
            order: {
              count: jest.fn(),
              aggregate: jest.fn(),
              groupBy: jest.fn(),
              findMany: jest.fn(),
            },
            orderItem: { groupBy: jest.fn() },
            user: { count: jest.fn() },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStats', () => {
    it('trả tổng quan + revenue PAID', async () => {
      jest.spyOn(prisma, '$transaction').mockResolvedValue([10, 5, 3, { _sum: { total: 1000 } }]);
      const result = await service.getStats();
      expect(result).toEqual({
        totalProducts: 10,
        totalOrders: 5,
        totalUsers: 3,
        totalRevenue: 1000,
      });
    });
  });

  describe('overview', () => {
    it('không trả revenue khi includeRevenue=false', async () => {
      jest.spyOn(prisma, '$transaction').mockResolvedValue([
        1, // totalProducts
        1, // totalOrders
        1, // totalUsers
        [], // statusRows
        [], // topRows
        [], // recentOrders
        0, // newUsersCount
      ]);
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([]);
      const result = await service.overview(false);
      expect(result).not.toHaveProperty('totalRevenue');
      expect(result.orderStatusBreakdown).toEqual([]);
      expect((result as any).topProducts).toEqual([]);
    });

    it('trả revenue khi includeRevenue=true', async () => {
      jest.spyOn(prisma, '$transaction').mockResolvedValue([
        1, // totalProducts
        1, // totalOrders
        1, // totalUsers
        [{ status: 'PAID', _count: 1 }], // statusRows
        [{ productId: 'p1', _sum: { qty: 2, price: 200 } }], // topRows
        [], // recentOrders
        0, // newUsersCount
      ]);
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([{ id: 'p1', title: 'A' }]);
      jest.spyOn(prisma.order, 'aggregate').mockResolvedValue({ _sum: { total: 500 } });
      const result = await service.overview(true);
      expect(result.totalRevenue).toBe(500);
      expect((result as any).topProducts[0]).toEqual({ id: 'p1', title: 'A', qty: 2, revenue: 200 });
    });
  });

  describe('revenue', () => {
    it('trả series N ngày, clamp days hợp lệ', async () => {
      jest.spyOn(prisma.order, 'findMany').mockResolvedValue([]);
      const result = await service.revenue(7);
      expect(result.days).toBe(7);
      expect(result.series).toHaveLength(7);
    });

    it('clamp days không hợp lệ về 30', async () => {
      jest.spyOn(prisma.order, 'findMany').mockResolvedValue([]);
      const result = await service.revenue(-5);
      expect(result.days).toBe(30);
      expect(result.series).toHaveLength(30);
    });

    it('cộng dồn doanh thu theo ngày', async () => {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      const key = day.toISOString().slice(0, 10);
      jest.spyOn(prisma.order, 'findMany').mockResolvedValue([
        { createdAt: day, total: 100 },
        { createdAt: day, total: 50 },
      ]);
      const result = await service.revenue(1);
      const entry = result.series.find((s) => s.date === key);
      expect(entry?.revenue).toBe(150);
    });
  });
});
