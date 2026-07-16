import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { ProjectType } from '@prisma/client';

// DTO tạo yêu cầu báo giá từ khách (form public, không cần login)
export class CreateRequestDto {
  @ApiProperty({ enum: ProjectType, description: 'Loại dự án' })
  @IsEnum(ProjectType)
  type!: ProjectType;

  @ApiProperty({ description: 'Tiêu đề yêu cầu' })
  @IsString()
  @Length(5, 200)
  title!: string;

  @ApiProperty({ description: 'Mô tả chi tiết nhu cầu' })
  @IsString()
  @Length(20, 5000)
  description!: string;

  @ApiProperty({ description: 'Ngân sách dự kiến (VND), bỏ trống nếu "thỏa thuận"' })
  @IsOptional()
  @IsInt()
  @Min(0)
  budget?: number;

  @ApiProperty({ description: 'Hạn mong muốn bàn giao (ISO datetime)' })
  @IsOptional()
  deadline?: string;

  @ApiProperty({ description: 'Danh sách key file đính kèm trên R2' })
  @IsOptional()
  fileKeys?: string[];

  // Thông tin liên hệ (dành cho khách vãng lai chưa login)
  @ApiProperty({ description: 'Tên liên hệ (khách vãng lai)' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  contactName?: string;

  @ApiProperty({ description: 'Email liên hệ (khách vãng lai)' })
  @IsOptional()
  @IsString()
  @Length(5, 200)
  contactEmail?: string;
}
