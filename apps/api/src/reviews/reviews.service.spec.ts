import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../database/prisma.service';
import { Prisma, ReviewStatus } from '@prisma/client';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: PrismaService,
          useValue: {
            product: { findUnique: jest.fn() },
            review: {
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

    service = module.get<ReviewsService>(ReviewsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('throw NotFound nếu sản phẩm không tồn tại', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(null);
      await expect(
        service.create('u1', { productId: 'p1', rating: 5 } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('tạo review PENDING kèm include user', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue({ id: 'p1' });
      const created = { id: 'r1', status: ReviewStatus.PENDING };
      jest.spyOn(prisma.review, 'create').mockResolvedValue(created);
      expect(await service.create('u1', { productId: 'p1', rating: 5 } as any)).toBe(created);
      expect(prisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ReviewStatus.PENDING, userId: 'u1' }),
        }),
      );
    });

    it('throw Conflict nếu user đã review (P2002)', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue({ id: 'p1' });
      const err = new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: '1',
      });
      jest.spyOn(prisma.review, 'create').mockRejectedValue(err);
      await expect(
        service.create('u1', { productId: 'p1', rating: 4 } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByUser', () => {
    it('trả review của user', async () => {
      const list = [{ id: 'r1' }];
      jest.spyOn(prisma.review, 'findMany').mockResolvedValue(list);
      expect(await service.findByUser('u1')).toBe(list);
      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1' } }),
      );
    });
  });

  describe('findAll', () => {
    it('trả tất cả nếu không lọc status', async () => {
      jest.spyOn(prisma.review, 'findMany').mockResolvedValue([]);
      await service.findAll();
      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('lọc theo status', async () => {
      jest.spyOn(prisma.review, 'findMany').mockResolvedValue([]);
      await service.findAll(ReviewStatus.APPROVED);
      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: ReviewStatus.APPROVED } }),
      );
    });
  });

  describe('approve', () => {
    it('throw NotFound nếu không tồn tại', async () => {
      jest.spyOn(prisma.review, 'findUnique').mockResolvedValue(null);
      await expect(service.approve('x')).rejects.toThrow(NotFoundException);
    });

    it('update status APPROVED', async () => {
      jest.spyOn(prisma.review, 'findUnique').mockResolvedValue({ id: 'r1' });
      const updated = { id: 'r1', status: ReviewStatus.APPROVED };
      jest.spyOn(prisma.review, 'update').mockResolvedValue(updated);
      expect(await service.approve('r1')).toBe(updated);
    });
  });

  describe('remove', () => {
    it('throw NotFound nếu xoá record không tồn tại (P2025)', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('no', {
        code: 'P2025',
        clientVersion: '1',
      });
      jest.spyOn(prisma.review, 'delete').mockRejectedValue(err);
      await expect(service.remove('x')).rejects.toThrow(NotFoundException);
    });

    it('xoá thành công', async () => {
      const deleted = { id: 'r1' };
      jest.spyOn(prisma.review, 'delete').mockResolvedValue(deleted);
      expect(await service.remove('r1')).toBe(deleted);
    });
  });
});
