import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../common/email/email.service';
import { CouponsService } from '../coupons/coupons.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { OrderStatus, PaymentProvider } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaService;
  let emailService: EmailService;

  const mockPrismaService: any = {
    $transaction: jest.fn(),
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    orderItem: {
      createMany: jest.fn(),
      create: jest.fn(),
    },
    license: {
      create: jest.fn(),
    },
  };

  const mockEmailService = {
    sendOrderConfirmation: jest.fn(),
    sendResetPasswordEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
  };

  const mockAuditService = { log: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: CouponsService, useValue: { validate: jest.fn() } },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should calculate total correctly and create order', async () => {
      const userId = 'user-1';
      const dto = {
        items: [
          { productId: 'product-1', qty: 2 },
          { productId: 'product-2', qty: 1 },
        ],
        provider: PaymentProvider.PAYOS,
      };

      // Mock product lookup
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: 'product-1', price: 10000 },
        { id: 'product-2', price: 20000 },
      ]);

      // Mock order creation
      mockPrismaService.order.create.mockResolvedValue({
        id: 'order-1',
        userId,
        status: OrderStatus.PENDING,
        total: 0,
        provider: PaymentProvider.PAYOS,
        createdAt: new Date(),
      });

      // Mock order item creation
      mockPrismaService.orderItem.create.mockResolvedValue({});

      // Mock transaction to return the order with items and user
      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        const tx = mockPrismaService;
        const order = await callback(tx);
        // Simulate the findUnique inside transaction
        tx.order.findUnique.mockResolvedValueOnce({
          id: 'order-1',
          userId,
          status: OrderStatus.PENDING,
          total: 40000, // 2*10000 + 1*20000
          provider: PaymentProvider.PAYOS,
          createdAt: new Date(),
          items: [
            { id: 'item-1', orderId: 'order-1', productId: 'product-1', price: 10000, product: { id: 'product-1' } },
            { id: 'item-2', orderId: 'order-1', productId: 'product-2', price: 20000, product: { id: 'product-2' } },
          ],
          user: { id: 'user-1', email: 'test@example.com' },
        });
        return tx.order.findUnique({
          where: { id: 'order-1' },
          include: {
            items: { include: { product: true } },
            user: true,
          },
        });
      });

      // Mock user email lookup
      mockPrismaService.user.findUnique.mockResolvedValue({ email: 'test@example.com' });

      const result = (await service.create(dto, userId))!;

      expect(result.total).toBe(40000);
      expect(result.items.length).toBe(2);
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['product-1', 'product-2'] },
          isPublished: true,
        },
        select: {
          id: true,
          price: true,
          tiers: { orderBy: { sortOrder: 'asc' } },
        },
      });
      expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({ id: 'order-1' }),
      );
    });

    it('should throw BadRequestException if a product is not found or not published', async () => {
      const userId = 'user-1';
      const dto = {
        items: [{ productId: 'non-existent', qty: 1 }],
      };

      mockPrismaService.product.findMany.mockResolvedValue([]);

      await expect(service.create(dto, userId)).rejects.toThrow(
        'Một hoặc nhiều sản phẩm không tồn tại hoặc chưa được công bố',
      );
    });
  });

  describe('findMyOrders', () => {
    it('findMany where userId, sắp xếp mới nhất', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([{ id: 'order-1' }]);
      await service.findMyOrders('user-1');
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { items: { include: { product: true } }, user: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findAll', () => {
    it('phân trang + lọc status qua transaction', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[{ id: 'o1' }], 1]);
      const res = await service.findAll({ status: OrderStatus.PAID, page: 2, limit: 5 });
      expect(res).toEqual({ data: [{ id: 'o1' }], total: 1, page: 2, limit: 5 });
      const where = mockPrismaService.order.findMany.mock.calls[0][0].where;
      expect(where.status).toBe(OrderStatus.PAID);
      expect(mockPrismaService.order.findMany.mock.calls[0][0].skip).toBe(5);
    });
  });

  describe('updateStatus', () => {
    it('order không tồn tại → NotFound', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus('x', OrderStatus.PAID)).rejects.toThrow(NotFoundException);
    });
    it('cập nhật status', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({ id: 'o1' });
      mockPrismaService.order.update.mockResolvedValue({ id: 'o1', status: OrderStatus.PAID });
      const res = await service.updateStatus('o1', OrderStatus.PAID);
      expect(res.status).toBe(OrderStatus.PAID);
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: { status: OrderStatus.PAID },
      });
    });
  });

  describe('setProviderRef', () => {
    it('update providerRef = String(code)', async () => {
      mockPrismaService.order.update.mockResolvedValue({});
      await service.setProviderRef('o1', 12345);
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: { providerRef: '12345' },
      });
    });
  });

  describe('confirmPayment', () => {
    it('order không tồn tại → throw Error', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => cb(mockPrismaService));
      await expect(service.confirmPayment('x')).rejects.toThrow('Order not found');
    });

    it('PAID + tạo license mỗi item + ghi audit ORDER_PAID', async () => {
      const order = {
        id: 'o1',
        userId: 'u1',
        items: [{ id: 'i1', productId: 'p1', licenseTierId: null, qty: 1 }],
      };
      mockPrismaService.order.findUnique.mockResolvedValue(order);
      mockPrismaService.order.update.mockResolvedValue({
        ...order,
        status: 'PAID',
        total: 100,
        items: [{ product: { title: 'P', slug: 'p' } }],
        licenses: [],
        user: { id: 'u1' },
      });
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => cb(mockPrismaService));
      const res = await service.confirmPayment('o1');
      expect(mockPrismaService.license.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u1',
          orderId: 'o1',
          orderItemId: 'i1',
          productId: 'p1',
          key: expect.any(String),
          downloadLimit: 5,
        }),
      });
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ORDER_PAID', entity: 'Order', entityId: 'o1' }),
      );
      expect(res.status).toBe('PAID');
    });

    it('license trùng (P2002) → bỏ qua, không throw', async () => {
      const order = { id: 'o1', userId: 'u1', items: [{ id: 'i1', productId: 'p1', licenseTierId: null }] };
      mockPrismaService.order.findUnique.mockResolvedValue(order);
      mockPrismaService.order.update.mockResolvedValue({ ...order, status: 'PAID' });
      const dup: any = new Error('dup');
      dup.code = 'P2002';
      mockPrismaService.license.create.mockRejectedValueOnce(dup);
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => cb(mockPrismaService));
      await expect(service.confirmPayment('o1')).resolves.toBeDefined();
    });
  });

  describe('findByProviderRef', () => {
    it('findFirst where providerRef = String(code)', async () => {
      mockPrismaService.order.findFirst.mockResolvedValue({ id: 'o1' });
      await service.findByProviderRef('999');
      expect(mockPrismaService.order.findFirst).toHaveBeenCalledWith({
        where: { providerRef: '999' },
        include: { items: { include: { product: true } }, user: true },
      });
    });
  });

  describe('findOne', () => {
    it('should throw ForbiddenException if user is not the owner and not admin', async () => {
      const orderId = 'order-1';
      const userId = 'user-1';
      const role = 'CUSTOMER'; // Not admin

      mockPrismaService.order.findUnique.mockResolvedValue({
        id: orderId,
        userId: 'user-2', // Different user
        status: OrderStatus.PENDING,
        total: 10000,
        provider: PaymentProvider.PAYOS,
        createdAt: new Date(),
        items: [],
        user: { id: 'user-2' },
      });

      await expect(service.findOne(orderId, userId, role)).rejects.toThrow(
        'Bạn không có quyền xem đơn hàng này',
      );
    });

    it('should return order if user is the owner', async () => {
      const orderId = 'order-1';
      const userId = 'user-1';
      const role = 'CUSTOMER';

      mockPrismaService.order.findUnique.mockResolvedValue({
        id: orderId,
        userId,
        status: OrderStatus.PENDING,
        total: 10000,
        provider: PaymentProvider.PAYOS,
        createdAt: new Date(),
        items: [],
        user: { id: userId },
      });

      const result = await service.findOne(orderId, userId, role);
      expect(result.userId).toBe(userId);
    });
  });
});