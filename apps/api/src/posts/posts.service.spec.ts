import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PrismaService } from '../database/prisma.service';
import { PostStatus, PostType, Prisma } from '@prisma/client';

describe('PostsService', () => {
  let service: PostsService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PrismaService,
          useValue: {
            post: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();
    service = module.get<PostsService>(PostsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('slugify (private)', () => {
    it('bỏ dấu + lowercase + dash', () => {
      expect((service as any).slugify('Học Lập Trình Đẹp!')).toBe('hoc-lap-trinh-dep');
    });
  });

  describe('findPublic', () => {
    it('chỉ lấy PUBLISHED + phân trang', async () => {
      jest.spyOn(prisma, '$transaction').mockResolvedValue([[{ id: 'p1' }], 1]);
      const res = await service.findPublic({ page: 2, limit: 5 });
      expect(res.page).toBe(2);
      const where = prisma.post.findMany.mock.calls[0][0].where;
      expect(where.status).toBe(PostStatus.PUBLISHED);
      expect(prisma.post.findMany.mock.calls[0][0].skip).toBe(5);
    });
  });

  describe('findPublicBySlug', () => {
    it('throw NotFound nếu không publish', async () => {
      jest.spyOn(prisma.post, 'findFirst').mockResolvedValue(null);
      await expect(service.findPublicBySlug('x')).rejects.toThrow(NotFoundException);
    });

    it('tăng viewCount + trả post', async () => {
      const post = { id: 'p1', viewCount: 9, slug: 's' };
      jest.spyOn(prisma.post, 'findFirst').mockResolvedValue(post);
      jest.spyOn(prisma.post, 'update').mockResolvedValue({});
      const res = await service.findPublicBySlug('s');
      expect(res.viewCount).toBe(10);
      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { viewCount: { increment: 1 } },
      });
    });
  });

  describe('admin', () => {
    it('findAllAdmin phân trang mọi trạng thái', async () => {
      jest.spyOn(prisma, '$transaction').mockResolvedValue([[], 0]);
      await service.findAllAdmin({ status: PostStatus.DRAFT });
      expect(prisma.post.findMany.mock.calls[0][0].where.status).toBe(PostStatus.DRAFT);
    });

    it('findOneAdmin throw NotFound', async () => {
      jest.spyOn(prisma.post, 'findUnique').mockResolvedValue(null);
      await expect(service.findOneAdmin('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('tạo bài với slug unique + publishedAt nếu PUBLISHED', async () => {
      jest.spyOn(prisma.post, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.post, 'create').mockResolvedValue({ id: 'p1' });
      await service.create(
        { title: 'Tiêu đề', status: PostStatus.PUBLISHED, type: PostType.BLOG } as any,
        'u1',
      );
      const data = prisma.post.create.mock.calls[0][0].data;
      expect(data.slug).toBe('tieu-de');
      expect(data.publishedAt).not.toBeNull();
      expect(data.authorId).toBe('u1');
    });

    it('throw Conflict nếu slug trùng (P2002)', async () => {
      jest.spyOn(prisma.post, 'findUnique').mockResolvedValue(null);
      const err = new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: '1',
      });
      jest.spyOn(prisma.post, 'create').mockRejectedValue(err);
      await expect(service.create({ title: 'A' } as any, 'u1')).rejects.toThrow(ConflictException);
    });
  });

  describe('update / remove', () => {
    it('update throw NotFound nếu không tồn tại', async () => {
      jest.spyOn(prisma.post, 'findUnique').mockResolvedValue(null);
      await expect(service.update('x', {} as any)).rejects.toThrow(NotFoundException);
    });

    it('update đổi slug khi nhập title mới', async () => {
      // Call 1: update() check exist → trả post. Call 2: ensureUniqueSlug → null (slug unique).
      jest.spyOn(prisma.post, 'findUnique')
        .mockResolvedValueOnce({ id: 'p1', publishedAt: null })
        .mockResolvedValueOnce(null);
      jest.spyOn(prisma.post, 'update').mockResolvedValue({ id: 'p1' });
      await service.update('p1', { title: 'Tiêu đề mới' } as any);
      expect(prisma.post.update.mock.calls[0][0].data.slug).toBe('tieu-de-moi');
    });

    it('remove throw NotFound nếu không tồn tại', async () => {
      jest.spyOn(prisma.post, 'findUnique').mockResolvedValue(null);
      await expect(service.remove('x')).rejects.toThrow(NotFoundException);
    });

    it('remove xoá thành công', async () => {
      jest.spyOn(prisma.post, 'findUnique').mockResolvedValue({ id: 'p1' });
      jest.spyOn(prisma.post, 'delete').mockResolvedValue({ id: 'p1' });
      expect(await service.remove('p1')).toEqual({ success: true });
    });
  });
});
