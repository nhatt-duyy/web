import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...dto,
        slug: dto.slug ?? this.generateSlug(dto.title),
        isPublished: dto.isPublished ?? false,
      },
    });
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async findAll(
    filter: { category?: string; isPublished?: boolean },
    sortBy: 'price' | 'createdAt' = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    page: number = 1,
    limit: number = 10,
  ) {
    // Danh sách công khai: LUÔN chỉ trả sản phẩm đã publish
    const where: any = { isPublished: true };

    if (filter.category) {
      where.category = {
        slug: filter.category,
      };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  async findOneBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isPublished: true },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với slug "${slug}"`);
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const updateData: any = { ...dto };
    if (dto.title && !dto.slug) {
      updateData.slug = this.generateSlug(dto.title);
    }
    try {
      return await this.prisma.product.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      this.throwIfNotFound(error, id);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.product.delete({ where: { id } });
    } catch (error) {
      this.throwIfNotFound(error, id);
    }
  }

  private throwIfNotFound(error: unknown, id: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundException(`Không tìm thấy sản phẩm với id "${id}"`);
    }
    throw error;
  }
}