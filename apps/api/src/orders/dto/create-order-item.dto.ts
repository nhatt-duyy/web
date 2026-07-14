import { IsString, IsInt, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsString()
  productId: string = '';

  @IsInt()
  @Min(1)
  qty: number = 0;
}