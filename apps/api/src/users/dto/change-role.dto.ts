import { IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

// DTO đổi vai trò user (chỉ ADMIN) — Phase 3 Mục 3 CRM.
export class ChangeRoleDto {
  @IsEnum(Role, { message: 'Vai trò không hợp lệ' })
  role!: Role;
}
