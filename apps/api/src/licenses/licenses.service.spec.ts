import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { WatermarkService } from '../common/watermark/watermark.service';
import { generateLicenseKey } from './license-key.util';

// Magic bytes của file zip (PK\x03\x04) — dùng để nhận diện zip buffer.
const ZIP_MAGIC = Buffer.from('504b0304', 'hex');
const USER_EMAIL = 'buyer@example.com';

// Tạo một zip buffer giả (chỉ cần magic bytes PK + vài byte thân) để test
// luồng watermark mà không phụ thuộc JSZip thực tế.
function fakeZipBuffer(): Buffer {
  return Buffer.concat([ZIP_MAGIC, Buffer.from('dummy-zip-content')]);
}

describe('LicensesService (Phase 5)', () => {
  let service: LicensesService;
  // Dùng `any` cho mock thủ công (pattern đồng bộ với products.service.spec.ts)
  // để TS không báo lỗi "mockResolvedValue does not exist" trên Prisma delegate.
  let prisma: any;
  let storage: any;
  let audit: any;
  let encryption: any;
  let watermark: any;

  const validKey = generateLicenseKey();

  beforeEach(async () => {
    // Khởi tạo mock thủ công (dễ control hơn useValue)
    prisma = {
      license: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    storage = {
      getObjectBuffer: jest.fn(),
      putObjectBuffer: jest.fn(),
    } as unknown as jest.Mocked<StorageService>;

    audit = {
      log: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditService>;

    encryption = {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    } as unknown as jest.Mocked<EncryptionService>;

    watermark = {
      addWatermark: jest.fn(),
    } as unknown as jest.Mocked<WatermarkService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LicensesService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
        { provide: AuditService, useValue: audit },
        { provide: EncryptionService, useValue: encryption },
        { provide: WatermarkService, useValue: watermark },
      ],
    }).compile();

    service = module.get<LicensesService>(LicensesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('streamDecrypted', () => {
    it('license hợp lệ + file .enc + plain là zip → gắn watermark chứa email', async () => {
      const zip = fakeZipBuffer();
      // Mock WatermarkService trả buffer chứa cả magic zip + nội dung watermark
      // (thực tế WatermarkService.buildContent sẽ nhúng email chủ sở hữu).
      const watermarked = Buffer.concat([
        zip,
        Buffer.from('WATERMARK.txt\nOwner       : ' + USER_EMAIL),
      ]);

      prisma.license.findFirst.mockResolvedValue({
        id: 'lic-1',
        userId: 'u-1',
        key: validKey,
        status: 'ACTIVE',
        productId: 'p-1',
        licenseTierId: null,
        expiresAt: null,
        product: {
          fileKey: 'products/p-1/source.zip.enc',
          title: 'Source A',
          slug: 'source-a',
        },
        user: { email: USER_EMAIL },
        order: { id: 'ord-1' },
      } as any);

      // blob mã hóa từ R2 → decrypt trả zip plaintext
      storage.getObjectBuffer.mockResolvedValue(Buffer.from('encrypted-blob'));
      encryption.decrypt.mockReturnValue(zip);
      watermark.addWatermark.mockResolvedValue(watermarked);

      const result = await service.streamDecrypted('u-1', 'lic-1');

      expect(storage.getObjectBuffer).toHaveBeenCalledWith('products/p-1/source.zip.enc');
      expect(encryption.decrypt).toHaveBeenCalled();
      expect(watermark.addWatermark).toHaveBeenCalled();
      // Buffer trả về phải chứa marker WATERMARK.txt
      expect(result.toString('utf8')).toContain('WATERMARK.txt');
      // Nội dung watermark phải chứa email đúng của chủ sở hữu
      expect(result.toString('utf8')).toContain(USER_EMAIL);
    });

    it('license không tồn tại → NotFound', async () => {
      prisma.license.findFirst.mockResolvedValue(null);
      await expect(service.streamDecrypted('u-1', 'lic-x')).rejects.toThrow(NotFoundException);
    });

    it('license REVOKED → Forbidden', async () => {
      prisma.license.findFirst.mockResolvedValue({
        id: 'lic-1',
        userId: 'u-1',
        status: 'REVOKED',
        product: { fileKey: 'products/p-1/source.zip.enc', title: 'A', slug: 'a' },
        user: { email: USER_EMAIL },
        order: null,
      } as any);
      await expect(service.streamDecrypted('u-1', 'lic-1')).rejects.toThrow(ForbiddenException);
    });

    it('sản phẩm chưa có fileKey → NotFound', async () => {
      prisma.license.findFirst.mockResolvedValue({
        id: 'lic-1',
        userId: 'u-1',
        status: 'ACTIVE',
        product: { fileKey: null, title: 'A', slug: 'a' },
        user: { email: USER_EMAIL },
        order: null,
      } as any);
      await expect(service.streamDecrypted('u-1', 'lic-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('revoke', () => {
    it('license ACTIVE → chuyển REVOKED + ghi audit', async () => {
      prisma.license.findUnique.mockResolvedValue({
        id: 'lic-1',
        status: 'ACTIVE',
        productId: 'p-1',
        key: validKey,
      } as any);
      prisma.license.update.mockResolvedValue({ id: 'lic-1', status: 'REVOKED' } as any);

      const result = await service.revoke('lic-1', 'admin-1');

      expect(result.status).toBe('REVOKED');
      expect(result.revoked).toBe(true);
      expect(prisma.license.update).toHaveBeenCalledWith({
        where: { id: 'lic-1' },
        data: { status: 'REVOKED' },
      });
      // Phải ghi audit LICENSE_REVOKE
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-1',
          action: 'LICENSE_REVOKE',
          entity: 'License',
          entityId: 'lic-1',
        }),
      );
    });

    it('license không tồn tại → NotFound', async () => {
      prisma.license.findUnique.mockResolvedValue(null);
      await expect(service.revoke('lic-x')).rejects.toThrow(NotFoundException);
    });

    it('license đã REVOKED từ trước → trả revoked=false', async () => {
      prisma.license.findUnique.mockResolvedValue({
        id: 'lic-1',
        status: 'REVOKED',
        productId: 'p-1',
        key: validKey,
      } as any);
      const result = await service.revoke('lic-1');
      expect(result.revoked).toBe(false);
      expect(prisma.license.update).not.toHaveBeenCalled();
    });
  });

  describe('findAllForUser', () => {
    it('trả license kèm product + tier, sắp xếp mới nhất', async () => {
      const rows = [{ id: 'lic-1', product: { title: 'A' } }];
      prisma.license.findMany.mockResolvedValue(rows);
      const res = await service.findAllForUser('u-1');
      expect(res).toBe(rows);
      expect(prisma.license.findMany).toHaveBeenCalledWith({
        where: { userId: 'u-1' },
        include: {
          product: { select: { id: true, title: true, slug: true, thumbnail: true, fileKey: true } },
          tier: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOneForUser', () => {
    it('license khác user → NotFound', async () => {
      prisma.license.findFirst.mockResolvedValue(null);
      await expect(service.findOneForUser('u-9', 'lic-1')).rejects.toThrow(NotFoundException);
    });

    it('trả license của đúng user', async () => {
      const lic = { id: 'lic-1', userId: 'u-1' };
      prisma.license.findFirst.mockResolvedValue(lic);
      expect(await service.findOneForUser('u-1', 'lic-1')).toBe(lic);
    });
  });

  describe('download', () => {
    const base = {
      id: 'lic-1',
      userId: 'u-1',
      status: 'ACTIVE',
      downloadCount: 0,
      downloadLimit: 5,
      downloadResetAt: new Date(),
      product: { fileKey: 'products/p-1/source.zip.enc', title: 'Source A' },
    };

    it('tạo streamUrl + tăng downloadCount + ghi audit', async () => {
      prisma.license.findFirst.mockResolvedValue({ ...base });
      prisma.license.update.mockResolvedValue({});
      const res = await service.download('u-1', 'lic-1');
      expect(res.streamUrl).toBe('/licenses/lic-1/stream');
      expect(res.downloadCount).toBe(1);
      expect(prisma.license.update).toHaveBeenCalledWith({
        where: { id: 'lic-1' },
        data: { downloadCount: { increment: 1 } },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LICENSE_DOWNLOAD', entity: 'License', entityId: 'lic-1' }),
      );
    });

    it('license REVOKED → Forbidden', async () => {
      prisma.license.findFirst.mockResolvedValue({ ...base, status: 'REVOKED' });
      await expect(service.download('u-1', 'lic-1')).rejects.toThrow(ForbiddenException);
    });

    it('hết lượt tải → Forbidden', async () => {
      prisma.license.findFirst.mockResolvedValue({ ...base, downloadCount: 5, downloadLimit: 5 });
      await expect(service.download('u-1', 'lic-1')).rejects.toThrow(/hết 5 lượt tải/);
    });

    it('quá kỳ reset (30 ngày) → reset count về 0 rồi cho tải', async () => {
      const old = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
      prisma.license.findFirst.mockResolvedValue({ ...base, downloadCount: 5, downloadResetAt: old });
      prisma.license.update.mockResolvedValue({});
      const res = await service.download('u-1', 'lic-1');
      expect(prisma.license.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'lic-1' }, data: expect.objectContaining({ downloadCount: 0 }) }),
      );
      expect(res.downloadCount).toBe(1);
    });

    it('sản phẩm chưa có fileKey → NotFound', async () => {
      prisma.license.findFirst.mockResolvedValue({ ...base, product: { fileKey: null } });
      await expect(service.download('u-1', 'lic-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('resetExpiredDownloads', () => {
    it('updateMany các license quá kỳ 30 ngày', async () => {
      prisma.license.updateMany.mockResolvedValue({ count: 3 });
      await service.resetExpiredDownloads();
      const where = prisma.license.updateMany.mock.calls[0][0].where;
      expect(where.downloadResetAt.lt).toBeInstanceOf(Date);
      expect(prisma.license.updateMany.mock.calls[0][0].data).toEqual({
        downloadCount: 0,
        downloadResetAt: expect.any(Date),
      });
    });
  });

  describe('verifyKey', () => {
    it('key hợp lệ + tồn tại + ACTIVE → valid', async () => {
      prisma.license.findUnique.mockResolvedValue({
        id: 'lic-1',
        productId: 'p-1',
        licenseTierId: 'tier-1',
        status: 'ACTIVE',
        expiresAt: null,
      } as any);
      const res = await service.verifyKey(validKey);
      expect(res.valid).toBe(true);
      expect(res.licenseId).toBe('lic-1');
    });

    it('key sai format → BAD_FORMAT', async () => {
      const res = await service.verifyKey('not-a-valid-key');
      expect(res.valid).toBe(false);
      expect(res.reason).toBe('BAD_FORMAT');
      // Không truy vấn DB với key rác
      expect(prisma.license.findUnique).not.toHaveBeenCalled();
    });

    it('license REVOKED → REVOKED', async () => {
      prisma.license.findUnique.mockResolvedValue({
        id: 'lic-1',
        status: 'REVOKED',
      } as any);
      const res = await service.verifyKey(validKey);
      expect(res.valid).toBe(false);
      expect(res.reason).toBe('REVOKED');
    });

    it('license hết hạn → EXPIRED', async () => {
      prisma.license.findUnique.mockResolvedValue({
        id: 'lic-1',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() - 1000),
      } as any);
      const res = await service.verifyKey(validKey);
      expect(res.valid).toBe(false);
      expect(res.reason).toBe('EXPIRED');
    });
  });
});
