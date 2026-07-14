import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS } from '@payos/node';
import * as crypto from 'crypto';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private payos: PayOS | null = null;
  private checksumKey: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
  ) {
    const clientId = this.configService.get<string>('PAYOS_CLIENT_ID');
    const apiKey = this.configService.get<string>('PAYOS_API_KEY');
    const checksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY');

    if (!clientId || !apiKey || !checksumKey) {
      this.logger.warn(
        'Thiếu cấu hình PayOS (PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY). Các chức năng thanh toán sẽ không hoạt động.',
      );
    } else {
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
  ): Promise<{ checkoutUrl: string; orderCode: number }> {
    const orderCode = Date.now(); // integer, unique enough for MVP

    // Lưu orderCode vào order.providerRef
    await this.ordersService.setProviderRef(order.id, orderCode);

    const payos = this.getPayOs();
    const paymentLink = await payos.paymentRequests.create({
      orderCode,
      amount: order.total,
      description: `SourceBan #${order.id}`,
      returnUrl: this.configService.get<string>('WEB_URL') + '/checkout/return',
      cancelUrl: this.configService.get<string>('WEB_URL') + '/checkout/cancel',
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

    const order = await this.ordersService.findByProviderRef(String(orderCode));
    if (!order) {
      this.logger.warn(`Không tìm thấy đơn hàng với orderCode: ${orderCode}`);
      return;
    }

    // PayOS trả về code '00' khi thanh toán thành công
    if (body.code === '00') {
      this.logger.log(`Thanh toán thành công cho đơn hàng ${order.id}, đang xử lý...`);
      await this.ordersService.confirmPayment(order.id);
    } else {
      this.logger.log(`Thanh toán không thành công (code: ${body.code}) cho đơn hàng ${order.id}`);
      // Tùy chọn: cập nhật статут order thành FAILED
      // await this.ordersService.updateStatus(order.id, 'FAILED');
    }
  }
}