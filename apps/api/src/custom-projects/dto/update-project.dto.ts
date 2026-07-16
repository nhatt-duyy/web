import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ProjectStatus, TicketPriority } from '@prisma/client';

// DTO cập nhật dự án (admin/STAFF): gắn assignee, deadline, priority, status
export class UpdateProjectDto {
  @ApiProperty({ description: 'ID nhân viên phụ trách (STAFF/ADMIN)' })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiProperty({ description: 'Hạn bàn giao (ISO datetime)' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiProperty({ enum: TicketPriority, description: 'Mức độ ưu tiên' })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiProperty({ enum: ProjectStatus, description: 'Trạng thái Kanban' })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}
