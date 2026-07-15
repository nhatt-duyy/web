import { IsString, IsOptional, IsEnum, Length } from 'class-validator';
import { PostType, PostStatus } from '@prisma/client';

// DTO cập nhật bài viết CMS (Mục 5 Phase 3) — mọi trường đều tùy chọn.
export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @Length(1, 200, { message: 'Tiêu đề từ 1-200 ký tự' })
  title?: string;

  @IsOptional()
  @IsEnum(PostType, { message: 'Loại bài viết không hợp lệ (BLOG/PAGE)' })
  type?: PostType;

  @IsOptional()
  @IsString()
  @Length(1, 220, { message: 'Slug từ 1-220 ký tự' })
  slug?: string;

  @IsOptional()
  @IsString()
  @Length(0, 300, { message: 'Tóm tắt tối đa 300 ký tự' })
  excerpt?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50000, { message: 'Nội dung quá dài (tối đa 50000 ký tự)' })
  content?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsEnum(PostStatus, { message: 'Trạng thái không hợp lệ (DRAFT/PUBLISHED)' })
  status?: PostStatus;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @Length(0, 160, { message: 'SEO title tối đa 160 ký tự' })
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @Length(0, 300, { message: 'SEO description tối đa 300 ký tự' })
  seoDescription?: string;
}
