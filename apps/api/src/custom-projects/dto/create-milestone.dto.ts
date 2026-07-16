import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

// DTO tạo milestone thanh toán theo giai đoạn
export class CreateMilestoneDto {
  @ApiProperty({ description: 'Tên giai đoạn (VD: Đặt cọc 30%)' })
  @IsString()
  @Length(2, 100)
  name!: string;

  @ApiProperty({ description: 'Mô tả giai đoạn' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @ApiProperty({ description: 'Số tiền thanh toán (VND)' })
  @IsInt()
  @Min(0)
  amount!: number;

  @ApiProperty({ description: 'Tỷ lệ % (dùng validate tổng = 100)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  percent?: number;

  @ApiProperty({ description: 'Hạn thanh toán (ISO datetime)' })
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ description: 'Thứ tự milestone' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
