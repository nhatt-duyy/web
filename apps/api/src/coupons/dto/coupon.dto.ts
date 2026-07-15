import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  Min,
  Length,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CouponType } from '@prisma/client';

export class CreateCouponDto {
  @IsString()
  @Length(3, 40)
  code!: string;

  @IsEnum(CouponType)
  type!: CouponType;

  @IsInt()
  @Min(1)
  value!: number; // PERCENT: 1-100, FIXED: số VND

  @IsOptional()
  @IsInt()
  @Min(0)
  minOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}

export class ValidateCouponDto {
  @IsString()
  code!: string;

  @IsInt()
  @Min(0)
  subtotal!: number;
}
