import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../common/email/email.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus, PaymentProvider, Product, License } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateOrderDto, userId: string) {
    // Validate each product exists and is published
    const productIds = dto.items.map(item => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        isPublished: true,
      },
      select: { id: true, price: true },
    });

    // Check if all products are found and published
    if (products.length !== productIds.length) {
      throw new BadRequestException('Một hoặc nhiều sản phẩm không tồn tại hoặc chưa được công bố');
    }

    // Create a map of productId to price for quick lookup
    const priceMap = new Map<string, number>();
    products.forEach(p => priceMap.set(p.id, p.price));

    // Calculate total
    let total = 0;
    for (const item of dto.items) {
      const price = priceMap.get(item.productId);
      if (price === undefined) {
        // This should not happen because we checked above, but just in case
        throw new BadRequestException(`Sản phẩm với id ${item.productId} không tồn tại hoặc chưa được công bố`);
      }
      total += price * item.qty;
    }

    // Determine provider
    const provider = dto.provider ?? PaymentProvider.PAYOS;

    // Create order and order items in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          userId,
          status: OrderStatus.PENDING,
          total,
          provider,
        },
      });

      // Create order items
      for (const item of dto.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            price: priceMap.get(item.productId)!,
          },
        });
      }

      // Return the order with items and user details
      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: true,
        },
      });
    });

    // Send order confirmation email (best effort)
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (user?.email) {
        await this.emailService.sendOrderConfirmation(user.email, order);
      }
    } catch (error: any) {
      // Log the error but don't fail the order creation
      console.error('Failed to send order confirmation email:', error);
    }

    return order;
  }

  async findMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với id ${id}`);
    }

    // Check if the user is the owner or an admin
    if (role !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem đơn hàng này');
    }

    return order;
  }

  async findAll(query: { status?: OrderStatus; page?: number; limit?: number }) {
    const { status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data: orders, total, page, limit };
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với id ${id}`);
    }

    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  async setProviderRef(orderId: string, code: number | string): Promise<void> {
    await this.prisma.order.update({
      where: { id: orderId },
      data: { providerRef: String(code) },
    });
  }

  async confirmPayment(orderId: string): Promise<import('@prisma/client').Order> {
    return this.prisma.$transaction(async (tx) => {
      // First, get the order with items to know what licenses to create
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      // Update order status to PAID
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: true,
        },
      });

      // Create a license for each order item (if not already exists)
      for (const item of order.items) {
        try {
          await tx.license.create({
            data: {
              userId: order.userId,
              orderId: order.id,
              productId: item.productId,
              key: this.genLicenseKey(),
              downloadCount: 0,
            },
          });
        } catch (error: any) {
          // Ignore duplicate key errors (P2002) - license already exists for this order/product
          if (error.code !== 'P2002') {
            throw error;
          }
          // If duplicate, we can optionally log or just skip
        }
      }

      return updatedOrder;
    });
  }

  private genLicenseKey(): string {
    // Generate a random 32-character hex string (16 bytes)
    return crypto.randomBytes(16).toString('hex');
  }

  async findByProviderRef(code: string): Promise<import('@prisma/client').Order | null> {
    return this.prisma.order.findFirst({
      where: { providerRef: String(code) },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });
  }
}