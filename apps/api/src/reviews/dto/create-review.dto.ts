import { IsInt, IsString, IsOptional, Min, Max, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'ID sản phẩm được đánh giá' })
  @IsString()
  productId!: string;

  @ApiProperty({ description: 'Sao từ 1 đến 5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({ description: 'Nội dung đánh giá (tuỳ chọn)', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  comment?: string;
}
