import { IsString, IsInt, IsOptional, IsArray, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Dữ liệu gói license khi admin tạo/sửa sản phẩm (đa license Phase 2)
export class TierInputDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsInt()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
