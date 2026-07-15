import { IsString, IsInt, Min, IsOptional } from 'class-validator';

export class CreateOrderItemDto {
  @IsString()
  productId: string = '';

  @IsInt()
  @Min(1)
  qty: number = 0;

  // Gói license khách chọn (đa license Phase 2)
  @IsOptional()
  @IsString()
  licenseTierId?: string;
}