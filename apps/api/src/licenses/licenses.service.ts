import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { isValidLicenseKeyFormat } from './license-key.util';

// Số ngày giữa các lần reset lượt tải
const RESET_DAYS = 30;

@Injectable()
export class LicensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly encryption: EncryptionService,
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

    // Phase 5: chặn tải nếu license bị thu hồi
    if (license.status === 'REVOKED') {
      throw new ForbiddenException('License đã bị thu hồi, không thể tải');
    }

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

    // Tăng số lượt tải
    await this.prisma.license.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });
    const newCount = license.downloadCount + 1;

    // Phase 5 — M2: file source đã mã hóa trên R2, backend stream-decrypt.
    // Trả URL nội bộ thay vì presigned URL thẳng R2 (không lộ file gốc).
    const streamUrl = `/licenses/${id}/stream`;

    // Ghi audit: ai tải license nào của sản phẩm gì
    await this.audit.log({
      userId,
      action: 'LICENSE_DOWNLOAD',
      entity: 'License',
      entityId: id,
      meta: { productId: license.productId, count: newCount },
    });

    return {
      streamUrl,
      downloadCount: newCount,
      downloadLimit: license.downloadLimit,
      resetAt: needsReset ? now : license.downloadResetAt,
    };
  }

  // Đọc + giải mã file source trả về buffer (dùng cho stream download).
  async streamDecrypted(userId: string, id: string): Promise<Buffer> {
    const license = await this.prisma.license.findFirst({
      where: { id, userId },
      include: { product: { select: { fileKey: true, title: true } } },
    });
    if (!license) throw new NotFoundException('Không tìm thấy license');
    if (license.status === 'REVOKED') {
      throw new ForbiddenException('License đã bị thu hồi, không thể tải');
    }
    if (!license.product.fileKey) {
      throw new NotFoundException('Sản phẩm chưa có file source để tải');
    }

    const blob = await this.storage.getObjectBuffer(license.product.fileKey);
    // Back-compat: file chưa mã hóa (.enc) thì trả thẳng, ngược lại decrypt.
    if (license.product.fileKey.endsWith('.enc')) {
      return this.encryption.decrypt(blob);
    }
    return blob;
  }

  // Xác minh license key (public API — cho client/3rd-party verify độc lập)
  // Trả về kết quả mà KHÔNG lộ key raw.
  async verifyKey(key: string): Promise<{
    valid: boolean;
    reason?: 'BAD_FORMAT' | 'NOT_FOUND' | 'REVOKED' | 'EXPIRED';
    licenseId?: string;
    productId?: string;
    tierId?: string | null;
  }> {
    // Bước 1: kiểm tra định dạng + checksum (offline, không cần DB)
    if (!isValidLicenseKeyFormat(key)) {
      return { valid: false, reason: 'BAD_FORMAT' };
    }

    const license = await this.prisma.license.findUnique({ where: { key } });
    if (!license) return { valid: false, reason: 'NOT_FOUND' };
    if (license.status === 'REVOKED') return { valid: false, reason: 'REVOKED' };
    if (license.expiresAt && license.expiresAt.getTime() < Date.now()) {
      return { valid: false, reason: 'EXPIRED' };
    }

    return {
      valid: true,
      licenseId: license.id,
      productId: license.productId,
      tierId: license.licenseTierId,
    };
  }

  // Thu hồi license (admin). Ghi audit để truy vết.
  async revoke(id: string, adminId?: string) {
    const license = await this.prisma.license.findUnique({ where: { id } });
    if (!license) throw new NotFoundException('Không tìm thấy license');
    if (license.status === 'REVOKED') {
      return { id, status: 'REVOKED', revoked: false, message: 'License đã bị thu hồi từ trước' };
    }
    const updated = await this.prisma.license.update({
      where: { id },
      data: { status: 'REVOKED' },
    });
    await this.audit.log({
      userId: adminId,
      action: 'LICENSE_REVOKE',
      entity: 'License',
      entityId: id,
      meta: { productId: license.productId, key: license.key },
    });
    return { id, status: updated.status, revoked: true, message: 'Đã thu hồi license' };
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
