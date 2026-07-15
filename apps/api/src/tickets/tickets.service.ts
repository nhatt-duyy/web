import { Injectable, NotFoundException } from '@nestjs/common';
import { TicketStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  // Tạo ticket mới (user)
  async create(userId: string, dto: CreateTicketDto) {
    return this.prisma.ticket.create({
      data: {
        userId,
        subject: dto.subject,
        message: dto.message,
        status: TicketStatus.OPEN,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  // Danh sách ticket của tôi
  async findAllForUser(userId: string) {
    return this.prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin: danh sách tất cả (lọc theo trạng thái)
  async adminFindAll(status?: TicketStatus) {
    return this.prisma.ticket.findMany({
      where: status ? { status } : undefined,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin: phản hồi (chuyển sang REPLIED)
  async reply(id: string, reply: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Không tìm thấy ticket');
    return this.prisma.ticket.update({
      where: { id },
      data: { reply, status: TicketStatus.REPLIED },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  // Admin: đóng ticket
  async close(id: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Không tìm thấy ticket');
    return this.prisma.ticket.update({
      where: { id },
      data: { status: TicketStatus.CLOSED },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }
}
