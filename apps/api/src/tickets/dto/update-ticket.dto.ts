import { IsOptional, IsEnum, IsString, IsIn, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus, TicketPriority } from '@prisma/client';

// Cập nhật ticket (admin/STAFF) — mọi trường tùy chọn.
export class UpdateTicketDto {
  @ApiProperty({ description: 'Trạng thái', enum: TicketStatus, required: false })
  @IsOptional()
  @IsEnum(TicketStatus, { message: 'Trạng thái không hợp lệ (OPEN/REPLIED/CLOSED)' })
  status?: TicketStatus;

  @ApiProperty({ description: 'Mức độ ưu tiên', enum: TicketPriority, required: false })
  @IsOptional()
  @IsEnum(TicketPriority, { message: 'Ưu tiên không hợp lệ (LOW/MEDIUM/HIGH)' })
  priority?: TicketPriority;

  @ApiProperty({ description: 'ID nhân viên được gán (null để bỏ gán)', required: false })
  @IsOptional()
  @IsString()
  assignedToId?: string | null;

  @ApiProperty({ description: 'Nội dung phản hồi', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 4000)
  reply?: string;
}
