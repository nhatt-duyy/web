import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';

// Số ngày giữa các lần reset lượt tải
const RESET_DAYS = 30;

@Injectable()
export class LicensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // Danh sách license của user đang đăng nhập (kèm sản phẩm + gói)
  async findAllForUser(userId: string) {
    return this.prisma.license.findMany({
      where: { userId },
      include: {
        product: { select: { id: true, title: true, slug: true, thumbnail: true, fileKey: true } },
        tier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Chi tiết 1 license (chỉ chủ sở hữu)
  async findOneForUser(userId: string, id: string) {
    const license = await this.prisma.license.findFirst({
      where: { id, userId },
      include: {
        product: { select: { id: true, title: true, slug: true, thumbnail: true, fileKey: true } },
        tier: { select: { id: true, name: true } },
      },
    });
    if (!license) throw new NotFoundException('Không tìm thấy license');
    return license;
  }

  // Tạo link tải file source (kiểm tra + reset giới hạn theo từng license)
  async download(userId: string, id: string) {
    const license = await this.prisma.license.findFirst({
      where: { id, userId },
      include: { product: { select: { fileKey: true, title: true } } },
    });
    if (!license) throw new NotFoundException('Không tìm thấy license');

    const now = new Date();
    const resetAt = new Date(license.downloadResetAt);
    const needsReset = now.getTime() - resetAt.getTime() > RESET_DAYS * 24 * 60 * 60 * 1000;

    // Reset lượt tải nếu đã quá kỳ (1 tháng/lần theo từng license)
    if (needsReset) {
      await this.prisma.license.update({
        where: { id },
        data: { downloadCount: 0, downloadResetAt: now },
      });
      license.downloadCount = 0;
    }

    // Kiểm tra giới hạn
    if (license.downloadCount >= license.downloadLimit) {
      throw new ForbiddenException(
        `Bạn đã dùng hết ${license.downloadLimit} lượt tải trong kỳ. Vui lòng đợi đến kỳ tiếp theo.`,
      );
    }

    if (!license.product.fileKey) {
      throw new NotFoundException('Sản phẩm chưa có file source để tải');
    }

    // Tăng số lượt tải và trả URL đã ký (5 phút hiệu lực)
    await this.prisma.license.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });
    const url = await this.storage.getSignedUrl(license.product.fileKey);
    return {
      url,
      downloadCount: license.downloadCount + 1,
      downloadLimit: license.downloadLimit,
      resetAt: needsReset ? now : license.downloadResetAt,
    };
  }

  // Cron hằng đêm: reset các license đã quá kỳ 30 ngày (chủ động)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetExpiredDownloads() {
    const threshold = new Date(Date.now() - RESET_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.license.updateMany({
      where: { downloadResetAt: { lt: threshold } },
      data: { downloadCount: 0, downloadResetAt: new Date() },
    });
  }
}
