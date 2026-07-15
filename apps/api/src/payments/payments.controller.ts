import { Controller, Post, Body, Req, UseGuards, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * Tạo liên kết thanh toán PayOS cho đơn hàng
   * Yêu cầu người dùng đã đăng nhập (JwtAuthGuard)
   * Body: { orderId: string }
   */
  @Post('payos/create')
  @UseGuards(JwtAuthGuard)
  async createPaymentLink(
    @Body('orderId') orderId: string,
    @Req() req: Request & { user: { id: string; role: string } },
  ) {
    // Lấy đơn hàng, kiểm tra quyền sở hữu (hoặc admin)
    const order = await this.ordersService.findOne(
      orderId,
      req.user.id,
      req.user.role,
    );

    // Since OrderItem does not contain qty in schema, we assume quantity = 1 for each item.
    // The total amount already accounts for quantity (if any) via order.total.
    const itemsWithQty = order.items.map(item => ({
      productId: item.productId,
      title: item.product?.title ?? item.productId,
      price: item.price,
      qty: item.qty ?? 1,
    }));

    const paymentLink = await this.paymentsService.createPaymentLink({
      id: order.id,
      total: order.total,
      items: itemsWithQty,
    });

    return {
      checkoutUrl: paymentLink.checkoutUrl,
      orderCode: paymentLink.orderCode,
    };
  }

  /**
   * Webhook endpoint để PayOS gọi back (không cần auth)
   * PayOS sẽ POST dữ liệu.json và gửi header x-payos-signature
   */
  @Post('payos/webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: Request & { rawBody?: string }) {
    // The raw body is set by the middleware in main.ts
    const rawBody = req.rawBody ?? '';
    if (!rawBody) {
      // Fallback: stringify the parsed body (less reliable but better than nothing)
      // tslint:disable-next-line:no-string-literal
      req.rawBody = JSON.stringify(req.body);
    }

    const signature = req.headers['x-payos-signature'] as string;

    const isValid = this.paymentsService.verifyWebhookSignature(
      req.rawBody ?? '',
      signature,
    );

    if (!isValid) {
      throw new BadRequestException('Chữ ký webhook không hợp lệ');
    }

    // Process webhook
    await this.paymentsService.handleWebhook(req.body);

    return { success: true };
  }
}