import { IsArray, ValidateNested, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';
import { PaymentProvider } from '@prisma/client';

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[] = [];

  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;
}