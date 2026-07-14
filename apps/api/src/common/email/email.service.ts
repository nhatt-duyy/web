import { Injectable } from '@nestjs/common';
@Injectable()
export class EmailService {
  async sendResetPasswordEmail(email: string, token: string): Promise<void> {
    // TODO(Task 4.5): thay bằng Resend thực tế
    console.log(`[EMAIL STUB] Gửi link reset cho ${email}: /reset-password?token=${token}`);
  }
}
