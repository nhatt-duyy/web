import { Injectable } from '@nestjs/common';
@Injectable()
export class EmailService {
  async sendResetPasswordEmail(email: string, token: string): Promise<void> {
    // TODO(Task 4.5): thay bằng Resend thực tế
    console.log(`[EMAIL STUB] Gửi link reset cho ${email}: /reset-password?token=${token}`);
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    // TODO(Task 4.5): thay bằng Resend thực tế
    console.log(`[EMAIL STUB] Gửi link xác thực cho ${email}: /auth/verify?token=${token}`);
  }

  async sendOrderConfirmation(email: string, order: unknown): Promise<void> {
    // TODO(Task 4.5): thay bằng Resend thực tế (template xác nhận đơn hàng)
    console.log(`[EMAIL STUB] Gửi xác nhận đơn hàng cho ${email}:`, order);
  }
}
