import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TicketStatus, TicketPriority } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../common/email/email.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

// Module Helpdesk (Mục 6 nâng cao): tạo/liệt kê/gán/đổi ưu tiên/phản hồi + email notify.
@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  private readonly include = {
    user: { select: { id: true, name: true, email: true } },
    assignedTo: { select: { id: true, name: true, email: true } },
  };

  // Tạo ticket mới (user)
  async create(userId: string, dto: CreateTicketDto) {
    return this.prisma.ticket.create({
      data: {
        userId,
        subject: dto.subject,
        message: dto.message,
        status: TicketStatus.OPEN,
        priority: dto.priority ?? TicketPriority.MEDIUM,
      },
      include: this.include,
    });
  }

  // Danh sách ticket của tôi (kèm người gán)
  async findAllForUser(userId: string) {
    return this.prisma.ticket.findMany({
      where: { userId },
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin/STAFF: danh sách + lọc (status, priority, assignedTo)
  async adminFindAll(filter: {
    status?: TicketStatus;
    priority?: TicketPriority;
    assignedToId?: string;
  }) {
    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.priority) where.priority = filter.priority;
    if (filter.assignedToId) {
      where.assignedToId = filter.assignedToId === 'unassigned' ? null : filter.assignedToId;
    }
    return this.prisma.ticket.findMany({
      where,
      include: this.include,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  // Gán nhân viên xử lý
  async assign(id: string, assignedToId: string | null) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Không tìm thấy ticket');
    if (assignedToId) {
      const staff = await this.prisma.user.findUnique({ where: { id: assignedToId } });
      if (!staff || (staff.role !== 'ADMIN' && staff.role !== 'STAFF')) {
        throw new BadRequestException('Chỉ được gán cho ADMIN hoặc STAFF');
      }
    }
    return this.prisma.ticket.update({
      where: { id },
      data: { assignedToId },
      include: this.include,
    });
  }

  // Admin/STAFF: cập nhật tổng quát (status/priority/assignedTo/reply)
  async update(id: string, dto: UpdateTicketDto) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Không tìm thấy ticket');

    const data: any = {};
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.assignedToId !== undefined) {
      if (dto.assignedToId) {
        const staff = await this.prisma.user.findUnique({ where: { id: dto.assignedToId } });
        if (!staff || (staff.role !== 'ADMIN' && staff.role !== 'STAFF')) {
          throw new BadRequestException('Chỉ được gán cho ADMIN hoặc STAFF');
        }
      }
      data.assignedToId = dto.assignedToId;
    }
    if (dto.reply !== undefined) {
      data.reply = dto.reply;
      // Có nội dung phản hồi → tự chuyển sang REPLIED (trừ khi gọi viên chỉ định status)
      if (!dto.status) data.status = TicketStatus.REPLIED;
    }
    if (dto.status !== undefined) {
      data.status = dto.status;
      // Quản lý closedAt: set khi CLOSED, xóa khi mở lại
      if (dto.status === TicketStatus.CLOSED) {
        data.closedAt = ticket.closedAt ?? new Date();
      } else if (ticket.status === TicketStatus.CLOSED) {
        data.closedAt = null;
      }
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data,
      include: this.include,
    });

    // Gửi email thông báo khi có phản hồi mới
    if (data.reply && updated.user?.email) {
      await this.email.sendTicketReplyEmail(updated.user.email, {
        subject: updated.subject,
        reply: data.reply,
      });
    }

    return updated;
  }

  // Admin/STAFF: phản hồi nhanh (giữ tương thích cũ)
  async reply(id: string, reply: string) {
    return this.update(id, { reply });
  }

  // Admin/STAFF: đóng ticket
  async close(id: string) {
    return this.update(id, { status: TicketStatus.CLOSED });
  }
}
