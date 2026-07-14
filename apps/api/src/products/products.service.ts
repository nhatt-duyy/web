import { Injectable } from '@nestjs/common';
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
    const where: any = {};

    if (filter.category) {
      where.category = {
        slug: filter.category,
      };
    }

    if (filter.isPublished !== undefined) {
      where.isPublished = filter.isPublished;
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
    return this.prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    const updateData: any = { ...dto };
    if (dto.title && !dto.slug) {
      updateData.slug = this.generateSlug(dto.title);
    }
    return this.prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }
}