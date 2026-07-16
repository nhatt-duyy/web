import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

// DTO gửi tin nhắn trao đổi trong dự án
export class SendMessageDto {
  @ApiProperty({ description: 'Nội dung tin nhắn' })
  @IsString()
  @Length(1, 2000)
  content!: string;
}
