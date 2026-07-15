import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, Coupon, CouponType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';

export interface CouponResult {
  coupon: Coupon;
  discount: number;
  total: number;
}

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateCouponDto) {
    if (dto.type === CouponType.PERCENT && dto.value > 100) {
      throw new BadRequestException('Giảm theo % không được vượt quá 100');
    }
    try {
      return await this.prisma.coupon.create({
        data: {
          code: dto.code.trim().toUpperCase(),
          type: dto.type,
          value: dto.value,
          minOrder: dto.minOrder ?? null,
          maxDiscount: dto.maxDiscount ?? null,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          active: dto.active ?? true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Mã giảm giá đã tồn tại');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.getOrThrow(id);
    if (dto.type === CouponType.PERCENT && dto.value !== undefined && dto.value > 100) {
      throw new BadRequestException('Giảm theo % không được vượt quá 100');
    }
    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...(dto.code !== undefined ? { code: dto.code.trim().toUpperCase() } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.value !== undefined ? { value: dto.value } : {}),
        ...(dto.minOrder !== undefined ? { minOrder: dto.minOrder } : {}),
        ...(dto.maxDiscount !== undefined ? { maxDiscount: dto.maxDiscount } : {}),
        ...(dto.expiresAt !== undefined
          ? { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }
          : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.getOrThrow(id);
    return this.prisma.coupon.delete({ where: { id } });
  }

  private async getOrThrow(id: string): Promise<Coupon> {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Không tìm thấy mã giảm giá');
    return coupon;
  }

  // Tính giảm giá — dùng chung cho web validate + orders checkout (server-authoritative)
  async validate(code: string, subtotal: number): Promise<CouponResult> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!coupon || !coupon.active) {
      throw new BadRequestException('Mã giảm giá không hợp lệ');
    }
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Mã giảm giá đã hết hạn');
    }
    if (coupon.minOrder && subtotal < coupon.minOrder) {
      throw new BadRequestException(
        `Đơn tối thiểu ${coupon.minOrder.toLocaleString('vi-VN')}đ để dùng mã này`,
      );
    }

    let discount =
      coupon.type === CouponType.PERCENT
        ? Math.floor((subtotal * coupon.value) / 100)
        : coupon.value;

    // Trần giảm cho loại PERCENT
    if (coupon.type === CouponType.PERCENT && coupon.maxDiscount) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
    // Không giảm quá tổng đơn
    discount = Math.min(discount, subtotal);

    return { coupon, discount, total: subtotal - discount };
  }
}
