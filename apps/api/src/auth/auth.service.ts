import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../common/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private email: EmailService,
  ) {}

  async register(dto: { email: string; password: string; name: string }) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email đã tồn tại');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, passwordHash, role: 'CUSTOMER' },
    });
    return this.signToken(user);
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Sai thông tin');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Sai thông tin');
    return this.signToken(user);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // không lộ user không tồn tại
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 phút
    await this.prisma.user.update({
      where: { email },
      data: { resetToken: token, resetExpires: expires },
    });
    await this.email.sendResetPasswordEmail(email, token);
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: { resetToken: token },
    });
    if (!user || !user.resetExpires || user.resetExpires < new Date())
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetExpires: null },
    });
    return { success: true };
  }

  async sendVerifyEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 giờ
    await this.prisma.user.update({
      where: { email },
      data: { verificationToken: token, verificationExpires: expires },
    });
    await this.email.sendVerificationEmail(email, token);
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user || !user.verificationExpires || user.verificationExpires < new Date())
      throw new UnauthorizedException('Token xác thực không hợp lệ hoặc đã hết hạn');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date(), verificationToken: null, verificationExpires: null },
    });
    return { success: true };
  }

  private signToken(user: { id: string; email: string; name: string | null; role: string }) {
    const name = user.name ?? '';
    return {
      access_token: this.jwt.sign({ sub: user.id, email: user.email, role: user.role }),
      // Trả kèm user để admin SPA (AuthContext) lấy ngay thông tin mà không cần gọi thêm.
      // Web NextAuth chỉ đọc access_token nên thêm field này vô hại.
      user: { id: user.id, email: user.email, name, role: user.role },
    };
  }
}
