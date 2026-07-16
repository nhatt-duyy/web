import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  // Cho phép admin cập nhật fileKey (key R2/MinIO lưu file source) khi upload/encrypt
  @IsOptional()
  @IsString()
  fileKey?: string;
}
