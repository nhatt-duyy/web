import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: any;
  private from: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.from = this.configService.get<string>('EMAIL_FROM') || 'no-reply@sourceban.com';

    if (apiKey) {
      const resend = require('resend');
      this.resend = resend(apiKey);
      this.logger.log('Resend email service initialized');
    } else {
      this.logger.warn('RESEND_API_KEY not set, email service will run in stub mode (logging only)');
    }
  }

  private async sendEmail(options: { to: string; subject: string; html: string }): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`Email stub: to=${options.to}, subject=${options.subject}`);
      this.logger.warn(`Email stub HTML: ${options.html}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      // Do not throw - we don't want to break the flow
    }
  }

  async sendResetPasswordEmail(email: string, token: string): Promise<void> {
    const subject = 'Đặt lại mật khẩu SourceBan';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Đặt lại mật khẩu</h2>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn nút dưới để thiết lập mật khẩu mới:</p>
        <a href="${process.env.WEB_URL || 'http://localhost:3000'}/reset-password?token=${token}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Đặt lại mật khẩu
        </a>
        <p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>
        <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
      </div>
    `.trim();
    return this.sendEmail({ to: email, subject, html });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const subject = 'Xác thực email';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Xác thực email của bạn</h2>
        <p>Cảm ơn bạn đã đăng ký! Nhấn nút dưới để xác thực địa chỉ email của bạn:</p>
        <a href="${process.env.WEB_URL || 'http://localhost:3000'}/auth/verify?token=${token}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Xác thực email
        </a>
        <p>Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.</p>
      </div>
    `.trim();
    return this.sendEmail({ to: email, subject, html });
  }

  async sendOrderConfirmation(email: string, order: any): Promise<void> {
    // Format total as VND
    const formatVND = (amount: number) => {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const subject = `Xác nhận đơn hàng #${order.id}`;
    const itemsHtml = order.items?.map((item: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product?.name || 'Produto'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatVND(item.price)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatVND(item.price * item.quantity)}</td>
      </tr>
    `).join('') || '';

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Cảm ơn bạn đã mua hàng!</h2>
        <p>Đơn hàng #${order.id} của bạn đã được xác nhận.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr>
              <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left;">Sản phẩm</th>
              <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: center;">Số lượng</th>
              <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: right;">Đơn giá</th>
              <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <p style="text-align: right; font-weight: bold; font-size: 1.2em;">
          Tổng: ${formatVND(order.total)}
        </p>
        <p>Các giấy phép sẽ được gửi tới email của bạn sau khi thanh toán được xác nhận.</p>
        <p>Bạn có thể xem chi tiết đơn hàng tại <a href="${process.env.WEB_URL || 'http://localhost:3000'}/dashboard/orders/${order.id}">trang cá nhân</a>.</p>
      </div>
    `.trim();
    return this.sendEmail({ to: email, subject, html });
  }

  async sendPaymentSuccess(email: string, order: any): Promise<void> {
    const subject = 'Thanh toán thành công';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thanh toán thành công!</h2>
        <p>Cảm ơn bạn đã thanh toán đơn hàng #${order.id}. Đơn hàng của bạn đã được xác nhận và đang được xử lý.</p>
        <p>Bạn có thể xem chi tiết đơn hàng và tải xuống tài nguyên tại <a href="${process.env.WEB_URL || 'http://localhost:3000'}/dashboard/orders/${order.id}">trang đơn hàng của bạn</a>.</p>
        <p>Nếu có bất kỳ câu hỏi nào, vui lòng trả lời email này hoặc liên hệ qua trang hỗ trợ.</p>
      </div>
    `.trim();
    return this.sendEmail({ to: email, subject, html });
  }
}
