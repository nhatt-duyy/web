import { Injectable, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS } from '@payos/node';
import * as crypto from 'crypto';
import { PaymentProvider } from '@prisma/client';
import { OrdersService } from '../orders/orders.service';
import { EmailService } from '../common/email/email.service';
import { PrismaService } from '../database/prisma.service';
import { CustomProjectsService } from '../custom-projects/custom-projects.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private payos: PayOS | null = null;
  private checksumKey: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => CustomProjectsService))
    private readonly customProjectsService: CustomProjectsService,
  ) {
    const clientId = this.configService.get<string>('PAYOS_CLIENT_ID');
    const apiKey = this.configService.get<string>('PAYOS_API_KEY');
    const checksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY');

    if (!clientId || !apiKey || !checksumKey) {
      this.logger.warn(
        'Thiếu cấu hình PayOS (PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY). Các chức năng thanh toán sẽ không hoạt động.',
      );
    } else {
      // PayOS SDK v2.0.5 ép đọc trực tiếp process.env.PAYOS_* nên phải gán trước khi init
      process.env.PAYOS_CLIENT_ID = clientId;
      process.env.PAYOS_API_KEY = apiKey;
      process.env.PAYOS_CHECKSUM_KEY = checksumKey;
      this.payos = new PayOS({
        clientId,
        apiKey,
        checksumKey,
      });
      this.checksumKey = checksumKey;
    }
  }

  private getPayOs(): PayOS {
    if (!this.payos) {
      throw new BadRequestException('PayOS chưa được cấu hình đúng');
    }
    return this.payos;
  }

  /**
   * Tạo liên kết thanh toán PayOS cho một đơn hàng
   * @param order Thông tin đơn hàng bao gồm id, total, items
   * @returns URL thanh toán và orderCode
   */
  async createPaymentLink(
    order: {
      id: string;
      total: number;
      items: Array<{
        productId: string;
        title?: string;
        price: number;
        qty: number;
      }>,
    },
    opts?: {
      description?: string;
      returnUrl?: string;
      cancelUrl?: string;
      isMilestone?: boolean; // milestone lưu providerRef riêng, không gọi Order.setProviderRef
    },
  ): Promise<{ checkoutUrl: string; orderCode: number }> {
    const orderCode = Date.now(); // integer, unique enough for MVP

    // Lưu orderCode vào order.providerRef (chỉ với Order; milestone lưu riêng trong service)
    if (!opts?.isMilestone) {
      await this.ordersService.setProviderRef(order.id, orderCode);
    }

    const webUrl = this.configService.get<string>('WEB_URL') || 'http://localhost:3000';
    const payos = this.getPayOs();
    const paymentLink = await payos.paymentRequests.create({
      orderCode,
      amount: order.total,
      description: (opts?.description ?? `SourceBan #${order.id}`).slice(0, 25),
      returnUrl: opts?.returnUrl ?? webUrl + '/checkout/return',
      cancelUrl: opts?.cancelUrl ?? webUrl + '/checkout/cancel',
      items: order.items.map(item => ({
        name: item.title ?? item.productId,
        quantity: item.qty,
        price: item.price,
      })),
    });

    return {
      checkoutUrl: paymentLink.checkoutUrl,
      orderCode: paymentLink.orderCode,
    };
  }

  /**
   * Xác minh chữ ký webhook PayOS (HMAC-SHA256)
   * @param rawBody corpo bruto de la solicitud (string)
   * @param signature header x-payos-signature
   * @returns true nếu signatures match
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.payos) {
      this.logger.warn('PayOS không được cấu hình, bỏ qua xác minh webhook');
      return false;
    }
    if (!this.checksumKey) {
      this.logger.warn('Checksum key không khả dụng, bỏ qua xác minh webhook');
      return false;
    }
    const expectedSignature = crypto
      .createHmac('sha256', this.checksumKey)
      .update(rawBody)
      .digest('hex');
    // TimingSafeEqual expects Buffers
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature),
      );
    } catch (err) {
      // This can happen if the strings are not valid base64 or lengths differ
      return false;
    }
  }

  /**
   * Xử lý webhook từ PayOS
   * @param body thân request đã được parse (giả sử là JSON)
   */
  async handleWebhook(body: any): Promise<void> {
    // PayOS gửi back code trong body.data? Theo docs: body có code, desc, data
    // Giả sử format: { code: '00', data: { orderCode: ... } }
    const orderCode = body.data?.orderCode ?? body.orderCode;
    if (!orderCode) {
      this.logger.warn('Webhook thiếu orderCode', { body });
      return;
    }

    // Ưu tiên: tìm Payment (dùng chung cho Order + Milestone)
    const payment = await this.prisma.payment.findUnique({
      where: {
        provider_providerRef: {
          provider: PaymentProvider.PAYOS,
          providerRef: String(orderCode),
        },
      },
    });

    // PayOS trả về code '00' khi thanh toán thành công
    if (body.code === '00') {
      if (payment?.milestoneId) {
        // Thanh toán milestone dự án custom
        this.logger.log(`Thanh toán milestone thành công (payment ${payment.id})`);
        await this.customProjectsService.markMilestonePaid(payment.id);
        return;
      }
      if (payment && !payment.milestoneId && payment.orderId) {
        // Thanh toán đơn hàng (fallback)
        await this.ordersService.confirmPayment(payment.orderId);
        return;
      }
      // Fallback cũ: tìm Order qua providerRef
      const order = await this.ordersService.findByProviderRef(String(orderCode));
      if (!order) {
        this.logger.warn(`Không tìm thấy giao dịch với orderCode: ${orderCode}`);
        return;
      }
      this.logger.log(`Thanh toán thành công cho đơn hàng ${order.id}, đang xử lý...`);
      await this.ordersService.confirmPayment(order.id);
      try {
        const userEmail = (order as any).user?.email;
        if (userEmail) await this.emailService.sendPaymentSuccess(userEmail, order);
      } catch (error: any) {
        this.logger.error('Failed to send payment success email:', error);
      }
    } else {
      this.logger.log(`Thanh toán không thành công (code: ${body.code}) cho orderCode ${orderCode}`);
    }
  }
}