import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // Khách hàng gửi review — mặc định PENDING chờ duyệt
  async create(userId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { id: true, isPublished: true },
    });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    try {
      return await this.prisma.review.create({
        data: {
          productId: dto.productId,
          userId,
          rating: dto.rating,
          comment: dto.comment ?? null,
          status: ReviewStatus.PENDING,
        },
        include: { user: { select: { name: true } } },
      });
    } catch (error) {
      // Mỗi user chỉ được review 1 lần / sản phẩm
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Bạn đã đánh giá sản phẩm này rồi');
      }
      throw error;
    }
  }

  // Review của user hiện tại
  async findByUser(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      include: { product: { select: { id: true, slug: true, title: true, thumbnail: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin: danh sách tất cả, lọc theo trạng thái
  async findAll(status?: ReviewStatus) {
    return this.prisma.review.findMany({
      where: status ? { status } : {},
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, slug: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin: duyệt review
  async approve(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá');
    return this.prisma.review.update({
      where: { id },
      data: { status: ReviewStatus.APPROVED },
      include: { user: { select: { name: true } } },
    });
  }

  // Admin: xoá review
  async remove(id: string) {
    try {
      return await this.prisma.review.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Không tìm thấy đánh giá');
      }
      throw error;
    }
  }
}
