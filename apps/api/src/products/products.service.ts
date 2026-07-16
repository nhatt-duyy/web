import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { SearchService } from '../search/search.service';
import { StorageService } from '../storage/storage.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly search: SearchService,
    private readonly storage: StorageService,
    private readonly encryption: EncryptionService,
  ) {}

  async create(dto: CreateProductDto) {
    // Tách tiers khỏi spread để tạo nested (bỏ id, để Prisma tự sinh)
    const { tiers, ...rest } = dto;
    const product = await this.prisma.product.create({
      data: {
        ...rest,
        slug: dto.slug ?? this.generateSlug(dto.title),
        isPublished: dto.isPublished ?? false,
        tiers: tiers?.length
          ? {
              create: tiers.map((t) => ({
                name: t.name,
                slug: t.slug,
                price: t.price,
                description: t.description,
                features: t.features,
                sortOrder: t.sortOrder ?? 0,
              })),
            }
          : undefined,
      },
      include: { category: true, tiers: { orderBy: { sortOrder: 'asc' } } },
    });
    // Đồng bộ index tìm kiếm (best-effort)
    await this.search.upsertProduct(product);
    return product;
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async findLanguages() {
    const rows = await this.prisma.product.findMany({
      where: { isPublished: true, language: { not: null } },
      select: { language: true },
      distinct: ['language'],
    });
    // Trả về mảng { value, label } (value = slug ngôn ngữ, label = viết hoa)
    return rows
      .map((r) => r.language as string)
      .filter(Boolean)
      .sort()
      .map((lang) => ({
        value: lang,
        label: lang.charAt(0).toUpperCase() + lang.slice(1),
      }));
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
        include: { category: true, tiers: { orderBy: { sortOrder: 'asc' } } },
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
      include: { category: true, tiers: { orderBy: { sortOrder: 'asc' } }, reviews: true },
    });
  }

  async findOneBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isPublished: true },
      include: {
        category: true,
        // Gói license (Regular / Extended) sắp xếp theo thứ tự
        tiers: { orderBy: { sortOrder: 'asc' } },
        // Chỉ lấy review đã duyệt (APPROVED) kèm tên user
        reviews: {
          where: { status: 'APPROVED' },
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với slug "${slug}"`);
    }
    return product;
  }

  // Sản phẩm liên quan: cùng danh mục, loại trừ sản phẩm hiện tại
  async getRelated(productId: string, categoryId: string, limit = 4) {
    const products = await this.prisma.product.findMany({
      where: {
        categoryId,
        isPublished: true,
        NOT: { id: productId },
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return products;
  }

  async update(id: string, dto: UpdateProductDto) {
    const updateData: any = { ...dto };
    if (dto.title && !dto.slug) {
      updateData.slug = this.generateSlug(dto.title);
    }
    // Nếu gửi tiers (kể cả mảng rỗng = xoá hết), thay thế toàn bộ gói license
    if (Array.isArray(dto.tiers)) {
      delete updateData.tiers;
      await this.prisma.$transaction([
        this.prisma.licenseTier.deleteMany({ where: { productId: id } }),
        ...(dto.tiers.length
          ? [
              this.prisma.licenseTier.createMany({
                data: dto.tiers.map((t) => ({
                  productId: id,
                  name: t.name,
                  slug: t.slug,
                  price: t.price,
                  description: t.description,
                  features: t.features,
                  sortOrder: t.sortOrder ?? 0,
                })),
              }),
            ]
          : []),
      ]);
    }
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: updateData,
        include: { category: true, tiers: { orderBy: { sortOrder: 'asc' } } },
      });
      // Đồng bộ index tìm kiếm (best-effort)
      await this.search.upsertProduct(product);
      return product;
    } catch (error) {
      this.throwIfNotFound(error, id);
    }
  }

  async remove(id: string) {
    try {
      const product = await this.prisma.product.delete({ where: { id } });
      // Xoá khỏi index tìm kiếm (best-effort)
      await this.search.removeProduct(id);
      return product;
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

  /**
   * Encrypt job (Phase 5 — M2): đọc file source plaintext từ R2,
   * mã hóa AES-256-GCM, ghi đè key `.enc`, cập nhật product.fileKey.
   * Giữ nguyên flow upload (admin vẫn upload presigned PUT), bước này
   * do admin trigger sau khi upload xong.
   */
  async encryptSource(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Không tìm thấy sản phẩm với id "${id}"`);
    if (!product.fileKey) {
      throw new NotFoundException('Sản phẩm chưa có file source để mã hóa');
    }
    if (product.fileKey.endsWith('.enc')) {
      return { id, fileKey: product.fileKey, encrypted: true, message: 'File đã được mã hóa từ trước' };
    }

    const plain = await this.storage.getObjectBuffer(product.fileKey);
    const encrypted = this.encryption.encrypt(plain);
    const newKey = `${product.fileKey}.enc`;
    await this.storage.putObjectBuffer(newKey, encrypted, 'application/octet-stream');

    const updated = await this.prisma.product.update({
      where: { id },
      data: { fileKey: newKey },
    });
    return { id, fileKey: updated.fileKey, encrypted: true, message: 'Đã mã hóa file source' };
  }
}