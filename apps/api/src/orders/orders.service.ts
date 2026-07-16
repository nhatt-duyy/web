import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../common/email/email.service';
import { CouponsService } from '../coupons/coupons.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus, PaymentProvider, Product, License } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly couponsService: CouponsService,
  ) {}

  async create(dto: CreateOrderDto, userId: string) {
    const productIds = dto.items.map((item) => item.productId);

    // Lấy sản phẩm + gói license kèm theo (giá authoritative từ server)
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isPublished: true },
      select: {
        id: true,
        price: true,
        tiers: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Một hoặc nhiều sản phẩm không tồn tại hoặc chưa được công bố');
    }

    const productMap = new Map<
      string,
      { price: number; tiers: { id: string; price: number; name: string }[] }
    >();
    products.forEach((p) => productMap.set(p.id, { price: p.price, tiers: p.tiers }));

    // Tính tiền từng item — ưu tiên giá gói license nếu khách chọn
    let subtotal = 0;
    const itemPricing: {
      productId: string;
      price: number;
      qty: number;
      licenseTierId: string | null;
      tierName: string | null;
    }[] = [];

    for (const item of dto.items) {
      const p = productMap.get(item.productId);
      if (!p) {
        throw new BadRequestException(`Sản phẩm ${item.productId} không hợp lệ`);
      }
      let price = p.price;
      let tierName: string | null = null;
      const licenseTierId: string | null = item.licenseTierId ?? null;

      if (licenseTierId) {
        const tier = p.tiers.find((t) => t.id === licenseTierId);
        if (!tier) {
          throw new BadRequestException('Gói license không thuộc sản phẩm này');
        }
        price = tier.price;
        tierName = tier.name;
      }

      subtotal += price * item.qty;
      itemPricing.push({ productId: item.productId, price, qty: item.qty, licenseTierId, tierName });
    }

    // Áp dụng mã giảm giá (server-authoritative)
    let couponCode: string | null = null;
    let total = subtotal;
    if (dto.couponCode) {
      const result = await this.couponsService.validate(dto.couponCode, subtotal);
      couponCode = result.coupon.code;
      total = result.total;
    }

    // Determine provider
    const provider = dto.provider ?? PaymentProvider.PAYOS;

    // Create order and order items in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          status: OrderStatus.PENDING,
          total,
          provider,
          couponCode,
        },
      });

      for (const it of itemPricing) {
        await tx.orderItem.create({
          data: {
            orderId: created.id,
            productId: it.productId,
            price: it.price,
            qty: it.qty,
            licenseTierId: it.licenseTierId,
            tierName: it.tierName,
          },
        });
      }

      return tx.order.findUnique({
        where: { id: created.id },
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

    // Đơn giá 0đ (miễn phí) → cấp license luôn, không cần thanh toán PayOS
    if (total === 0) {
      const freeOrder = await this.confirmPayment(order!.id);
      return freeOrder;
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

    // Check if the user is the owner, an admin, or support staff
    if (role !== 'ADMIN' && role !== 'STAFF' && order.userId !== userId) {
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

  async confirmPayment(
    orderId: string,
  ): Promise<import('@prisma/client').Order & { items: any[] }> {
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

      // Tạo license cho MỖI order item (Phase 2: 1 license / 1 item)
      for (const item of order.items) {
        try {
          await tx.license.create({
            data: {
              userId: order.userId,
              orderId: order.id,
              orderItemId: item.id,
              productId: item.productId,
              licenseTierId: item.licenseTierId ?? null,
              key: this.genLicenseKey(),
              downloadCount: 0,
              downloadLimit: 5,
            },
          });
        } catch (error: any) {
          // Bỏ qua lỗi trùng khóa (P2002) - license đã tồn tại cho item này
          if (error.code !== 'P2002') {
            throw error;
          }
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