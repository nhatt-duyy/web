import { IsBoolean } from 'class-validator';

// DTO khóa/mở tài khoản (chỉ ADMIN) — Phase 3 Mục 3 CRM.
export class UpdateActiveDto {
  @IsBoolean({ message: 'Trạng thái isActive phải là boolean' })
  isActive!: boolean;
}
