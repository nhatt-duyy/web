import { IsString, IsOptional, IsEnum, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketPriority } from '@prisma/client';

// Tạo ticket hỗ trợ (1 subject + 1 message, status OPEN)
export class CreateTicketDto {
  @ApiProperty({ description: 'Tiêu đề yêu cầu hỗ trợ' })
  @IsString()
  @Length(3, 120)
  subject!: string;

  @ApiProperty({ description: 'Nội dung yêu cầu' })
  @IsString()
  @Length(5, 4000)
  message!: string;

  @ApiProperty({ description: 'Mức độ ưu tiên', enum: TicketPriority, required: false })
  @IsOptional()
  @IsEnum(TicketPriority, { message: 'Ưu tiên không hợp lệ (LOW/MEDIUM/HIGH)' })
  priority?: TicketPriority;
}
