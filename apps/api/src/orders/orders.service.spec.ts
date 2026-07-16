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

  const mockPrismaService = {
    $transaction: jest.fn(),
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
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