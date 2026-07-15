import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma, PostStatus, PostType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

// Service CMS: quản lý bài viết blog + trang tĩnh (Mục 5 Phase 3).
@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  // Tạo slug thân thiện, bỏ dấu tiếng Việt.
  private slugify(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // bỏ dấu (U+0300–U+036F)
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Đảm bảo slug là duy nhất (thêm hậu tố -2, -3... nếu trùng).
  private async ensureUniqueSlug(base: string, ignoreId?: string): Promise<string> {
    let slug = base || 'bai-viet';
    let i = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await this.prisma.post.findUnique({ where: { slug } });
      if (!existing || existing.id === ignoreId) return slug;
      i += 1;
      slug = `${base}-${i}`;
    }
  }

  // === PUBLIC: danh sách bài đã xuất bản ===
  async findPublic(query: {
    type?: PostType;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 && query.limit <= 50 ? query.limit : 12;
    const where: Prisma.PostWhereInput = {
      status: PostStatus.PUBLISHED,
      ...(query.type ? { type: query.type } : {}),
      ...(query.category ? { categoryId: query.category } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          viewCount: true,
          author: { select: { name: true } },
          category: { select: { name: true, slug: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  // === PUBLIC: chi tiết theo slug, tăng viewCount an toàn (increment) ===
  async findPublicBySlug(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: { slug, status: PostStatus.PUBLISHED },
      include: {
        author: { select: { name: true } },
        category: { select: { name: true, slug: true } },
      },
    });
    if (!post) throw new NotFoundException(`Không tìm thấy bài viết "${slug}"`);
    // Tăng lượt xem — increment tránh race condition (không đọc-ghi thủ công).
    await this.prisma.post.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } });
    return { ...post, viewCount: post.viewCount + 1 };
  }

  // === ADMIN: danh sách toàn bộ (mọi trạng thái) ===
  async findAllAdmin(query: { type?: PostType; status?: PostStatus; page?: number; limit?: number }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 && query.limit <= 100 ? query.limit : 20;
    const where: Prisma.PostWhereInput = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          slug: true,
          status: true,
          viewCount: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { name: true, email: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  // === ADMIN: chi tiết theo id (để sửa) ===
  async findOneAdmin(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { author: { select: { name: true, email: true } }, category: { select: { name: true } } },
    });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    return post;
  }

  // === ADMIN: tạo bài ===
  async create(dto: CreatePostDto, authorId: string) {
    const base = this.slugify(dto.slug ?? dto.title);
    const slug = await this.ensureUniqueSlug(base);
    const status = dto.status ?? PostStatus.DRAFT;
    try {
      return await this.prisma.post.create({
        data: {
          title: dto.title,
          type: dto.type ?? PostType.BLOG,
          slug,
          excerpt: dto.excerpt,
          content: dto.content,
          coverImage: dto.coverImage,
          status,
          categoryId: dto.categoryId,
          authorId,
          seoTitle: dto.seoTitle,
          seoDescription: dto.seoDescription,
          // Đặt publishedAt khi xuất bản lần đầu.
          publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Slug đã tồn tại');
      }
      throw e;
    }
  }

  // === ADMIN: cập nhật bài ===
  async update(id: string, dto: UpdatePostDto) {
    const current = await this.prisma.post.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Không tìm thấy bài viết');

    const data: Prisma.PostUpdateInput = {
      title: dto.title,
      type: dto.type,
      excerpt: dto.excerpt,
      content: dto.content,
      coverImage: dto.coverImage,
      seoTitle: dto.seoTitle,
      seoDescription: dto.seoDescription,
    };

    if (dto.categoryId !== undefined) {
      data.category = dto.categoryId ? { connect: { id: dto.categoryId } } : { disconnect: true };
    }

    // Đổi slug nếu người dùng nhập slug mới, hoặc đổi tiêu đề (và không tự nhập slug).
    if (dto.slug) {
      data.slug = await this.ensureUniqueSlug(this.slugify(dto.slug), id);
    } else if (dto.title) {
      data.slug = await this.ensureUniqueSlug(this.slugify(dto.title), id);
    }

    // Set publishedAt khi chuyển sang PUBLISHED lần đầu.
    if (dto.status) {
      data.status = dto.status;
      if (dto.status === PostStatus.PUBLISHED && !current.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    try {
      return await this.prisma.post.update({ where: { id }, data });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Slug đã tồn tại');
      }
      throw e;
    }
  }

  // === ADMIN: xóa bài ===
  async remove(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    await this.prisma.post.delete({ where: { id } });
    return { success: true };
  }
}
