import { IsString, IsInt, IsOptional, IsBoolean, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TierInputDto } from './tier-input.dto';

export class CreateProductDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsInt()
  @Min(0)
  price!: number;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  // Gallery + demo + ngôn ngữ (Phase 2)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  demoUrl?: string;

  @IsOptional()
  @IsString()
  language?: string;

  // Gói license (đa license Phase 2)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TierInputDto)
  tiers?: TierInputDto[];
}