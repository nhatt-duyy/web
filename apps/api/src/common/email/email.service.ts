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
      const resendModule = require('resend');
      const Resend = resendModule.Resend || resendModule.default || resendModule;
      this.resend = new Resend(apiKey);
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
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product?.title || 'Sản phẩm'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.qty ?? 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatVND(item.price)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatVND(item.price * (item.qty ?? 1))}</td>
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

  async sendTicketReplyEmail(email: string, ticket: { subject: string; reply: string }): Promise<void> {
    const subject = `Phản hồi yêu cầu hỗ trợ: ${ticket.subject}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Yêu cầu hỗ trợ của bạn đã được phản hồi</h2>
        <p><strong>Tiêu đề:</strong> ${ticket.subject}</p>
        <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          ${ticket.reply.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')}
        </div>
        <p>Bạn có thể xem chi tiết tại <a href="${process.env.WEB_URL || 'http://localhost:3000'}/dashboard/support">trang hỗ trợ</a>.</p>
        <p>Nếu câu hỏi chưa được giải đáp, vui lòng phản hồi tiếp tại trang hỗ trợ.</p>
      </div>
    `.trim();
    return this.sendEmail({ to: email, subject, html });
  }

  async sendPaymentSuccess(email: string, order: any): Promise<void> {
    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    const subject = 'Thanh toán thành công — Source code đã sẵn sàng tải về';

    // Danh sách sản phẩm kèm link tải source code trực tiếp
    const items = Array.isArray(order.licenses)
      ? order.licenses
      : order.items ?? [];
    const productList = items
      .map((lic: any) => {
        const title = lic.product?.title ?? lic.title ?? 'Sản phẩm';
        const downloadUrl = `${webUrl}/dashboard/orders/${order.id}`;
        return `<li style="margin: 8px 0;">
          <strong>${title}</strong><br/>
          <a href="${downloadUrl}" style="color:#2563eb;">⬇️ Tải source code tại đây</a>
        </li>`;
      })
      .join('');

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🎉 Thanh toán thành công!</h2>
        <p>Cảm ơn bạn đã thanh toán đơn hàng <strong>#${order.id}</strong>. Source code của bạn đã sẵn sàng để tải về.</p>
        <p><strong>Danh sách source code:</strong></p>
        <ul style="padding-left: 18px;">${productList || '<li>Không có sản phẩm</li>'}</ul>
        <p>Bạn cũng có thể xem chi tiết và lịch sử tải tại <a href="${webUrl}/dashboard/orders/${order.id}">trang đơn hàng của bạn</a>.</p>
        <p style="color:#64748b; font-size:13px;">Lưu ý: mỗi license có giới hạn lượt tải, vui lòng tải và lưu trữ cẩn thận.</p>
      </div>
    `.trim();
    return this.sendEmail({ to: email, subject, html });
  }

  /** Thông báo cho admin khi có yêu cầu báo giá mới */
  async sendCustomRequestNotify(
    email: string,
    req: { title: string; type: string; budget?: number | null; contactName: string; contactEmail: string },
  ): Promise<void> {
    const formatVND = (amount?: number | null) =>
      amount
        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
        : 'Thỏa thuận';
    const subject = `[SourceBan] Yêu cầu báo giá mới: ${req.title}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Yêu cầu báo giá mới</h2>
        <p><strong>Tiêu đề:</strong> ${req.title}</p>
        <p><strong>Loại dự án:</strong> ${req.type}</p>
        <p><strong>Ngân sách:</strong> ${formatVND(req.budget)}</p>
        <p><strong>Người liên hệ:</strong> ${req.contactName} (${req.contactEmail})</p>
        <p>Vui lòng đăng nhập admin để xem chi tiết và phản hồi.</p>
      </div>
    `.trim();
    return this.sendEmail({ to: email, subject, html });
  }

  /** Thông báo cho khách khi trạng thái dự án thay đổi */
  async sendProjectUpdateEmail(
    email: string,
    project: { title: string; status: string },
  ): Promise<void> {
    const subject = `Cập nhật dự án: ${project.title}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Dự án của bạn đã cập nhật</h2>
        <p>Dự án <strong>${project.title}</strong> đã chuyển sang trạng thái: <strong>${project.status}</strong>.</p>
        <p>Bạn có thể xem chi tiết tiến độ tại <a href="${process.env.WEB_URL || 'http://localhost:3000'}/dashboard/projects">trang dự án của tôi</a>.</p>
      </div>
    `.trim();
    return this.sendEmail({ to: email, subject, html });
  }

  /** Xác nhận khách đã thanh toán thành công một milestone */
  async sendMilestonePaidEmail(
    email: string,
    data: { projectTitle: string; milestoneName: string; amount: number },
  ): Promise<void> {
    const formatVND = (amount: number) =>
      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    const subject = `Đã nhận thanh toán: ${data.milestoneName} (${data.projectTitle})`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Cảm ơn bạn đã thanh toán</h2>
        <p>Chúng tôi đã nhận được <strong>${formatVND(data.amount)}</strong> cho mốc <strong>${data.milestoneName}</strong> thuộc dự án <strong>${data.projectTitle}</strong>.</p>
        <p>Đội ngũ sẽ tiếp tục triển khai theo tiến độ. Bạn có thể theo dõi tại <a href="${process.env.WEB_URL || 'http://localhost:3000'}/dashboard/projects">trang dự án của tôi</a>.</p>
      </div>
    `.trim();
    return this.sendEmail({ to: email, subject, html });
  }
}
