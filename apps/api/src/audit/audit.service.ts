import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface AuditInput {
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  ip?: string;
  meta?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ghi một bản ghi audit. Bắt lỗi để không làm gãy luồng nghiệp vụ chính.
   */
  async log(input: AuditInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: input.userId ?? null,
          action: input.action,
          entity: input.entity ?? null,
          entityId: input.entityId ?? null,
          ip: input.ip ?? null,
          meta: input.meta ?? undefined,
        },
      });
    } catch (error: any) {
      // Audit là side-effect, không được ném lỗi lên luồng chính
      console.error('[Audit] ghi log thất bại:', error?.message);
    }
  }

  /**
   * Liệt kê audit log (ADMIN) kèm filter + phân trang.
   */
  async findAll(filter: {
    action?: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(100, Math.max(1, filter.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.action) where.action = filter.action;
    if (filter.from || filter.to) {
      where.createdAt = {};
      if (filter.from) where.createdAt.gte = filter.from;
      if (filter.to) where.createdAt.lte = filter.to;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
