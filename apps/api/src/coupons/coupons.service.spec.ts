import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { PrismaService } from '../database/prisma.service';
import { CouponType, Prisma } from '@prisma/client';

describe('CouponsService', () => {
  let service: CouponsService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        {
          provide: PrismaService,
          useValue: {
            coupon: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create coupon với code uppercase', async () => {
      const dto = { code: 'sale10', type: CouponType.PERCENT, value: 10 } as any;
      const result = { id: '1', ...dto, code: 'SALE10' };
      jest.spyOn(prisma.coupon, 'create').mockResolvedValue(result);
      expect(await service.create(dto)).toBe(result);
      expect(prisma.coupon.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ code: 'SALE10', type: CouponType.PERCENT, value: 10 }),
      });
    });

    it('should throw BadRequest nếu PERCENT > 100', async () => {
      const dto = { code: 'x', type: CouponType.PERCENT, value: 150 } as any;
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(prisma.coupon.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequest nếu code trùng (P2002)', async () => {
      const dto = { code: 'dup', type: CouponType.FIXED, value: 1000 } as any;
      const err = new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '1' });
      jest.spyOn(prisma.coupon, 'create').mockRejectedValue(err);
      await expect(service.create(dto)).rejects.toThrow('Mã giảm giá đã tồn tại');
    });
  });

  describe('remove', () => {
    it('should throw NotFound nếu không tồn tại', async () => {
      jest.spyOn(prisma.coupon, 'findUnique').mockResolvedValue(null);
      await expect(service.remove('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('validate', () => {
    it('should compute percent discount with cap', async () => {
      jest.spyOn(prisma.coupon, 'findUnique').mockResolvedValue({
        code: 'HALF',
        active: true,
        type: CouponType.PERCENT,
        value: 50,
        maxDiscount: 100,
        expiresAt: null,
        minOrder: null,
      } as any);
      const result = await service.validate('half', 300);
      expect(result.discount).toBe(100); // capped
      expect(result.total).toBe(200);
    });

    it('should throw BadRequest nếu coupon không hợp lệ', async () => {
      jest.spyOn(prisma.coupon, 'findUnique').mockResolvedValue(null);
      await expect(service.validate('bad', 100)).rejects.toThrow('Mã giảm giá không hợp lệ');
    });

    it('should throw BadRequest nếu hết hạn', async () => {
      jest.spyOn(prisma.coupon, 'findUnique').mockResolvedValue({
        code: 'OLD',
        active: true,
        type: CouponType.FIXED,
        value: 1000,
        maxDiscount: null,
        expiresAt: new Date(Date.now() - 1000),
        minOrder: null,
      } as any);
      await expect(service.validate('old', 100)).rejects.toThrow('Mã giảm giá đã hết hạn');
    });
  });
});
