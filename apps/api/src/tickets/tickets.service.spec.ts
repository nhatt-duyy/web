import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../common/email/email.service';
import { TicketStatus, TicketPriority } from '@prisma/client';

describe('TicketsService', () => {
  let service: TicketsService;
  let prisma: any;
  let email: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: PrismaService,
          useValue: {
            ticket: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            user: { findUnique: jest.fn() },
          },
        },
        {
          provide: EmailService,
          useValue: { sendTicketReplyEmail: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    prisma = module.get<PrismaService>(PrismaService);
    email = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('tạo ticket OPEN với priority mặc định MEDIUM', async () => {
      const created = { id: 't1', status: TicketStatus.OPEN };
      jest.spyOn(prisma.ticket, 'create').mockResolvedValue(created);
      expect(await service.create('u1', { subject: 'S', message: 'M' } as any)).toBe(created);
      expect(prisma.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'u1',
            status: TicketStatus.OPEN,
            priority: TicketPriority.MEDIUM,
          }),
        }),
      );
    });
  });

  describe('adminFindAll', () => {
    it('lọc assignedToId = unassigned thành null', async () => {
      jest.spyOn(prisma.ticket, 'findMany').mockResolvedValue([]);
      await service.adminFindAll({ assignedToId: 'unassigned' });
      expect(prisma.ticket.findMany.mock.calls[0][0].where.assignedToId).toBeNull();
    });
  });

  describe('assign', () => {
    it('throw NotFound nếu ticket không tồn tại', async () => {
      jest.spyOn(prisma.ticket, 'findUnique').mockResolvedValue(null);
      await expect(service.assign('x', 's1')).rejects.toThrow(NotFoundException);
    });

    it('throw BadRequest nếu gán cho user không phải ADMIN/STAFF', async () => {
      jest.spyOn(prisma.ticket, 'findUnique').mockResolvedValue({ id: 't1' });
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 's1', role: 'CUSTOMER' });
      await expect(service.assign('t1', 's1')).rejects.toThrow(BadRequestException);
    });

    it('assign thành công cho STAFF', async () => {
      jest.spyOn(prisma.ticket, 'findUnique').mockResolvedValue({ id: 't1' });
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 's1', role: 'STAFF' });
      const updated = { id: 't1', assignedToId: 's1' };
      jest.spyOn(prisma.ticket, 'update').mockResolvedValue(updated);
      expect(await service.assign('t1', 's1')).toBe(updated);
    });
  });

  describe('update', () => {
    it('throw NotFound nếu ticket không tồn tại', async () => {
      jest.spyOn(prisma.ticket, 'findUnique').mockResolvedValue(null);
      await expect(service.update('x', { status: TicketStatus.CLOSED } as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('set closedAt khi CLOSED, gửi email nếu có reply', async () => {
      const ticket = { id: 't1', status: TicketStatus.OPEN, closedAt: null };
      jest.spyOn(prisma.ticket, 'findUnique').mockResolvedValue(ticket);
      const updated = { id: 't1', user: { email: 'a@b.c' }, subject: 'S' };
      jest.spyOn(prisma.ticket, 'update').mockResolvedValue(updated);
      await service.update('t1', { reply: 'Đã xử lý', status: TicketStatus.CLOSED } as any);
      const data = prisma.ticket.update.mock.calls[0][0].data;
      expect(data.closedAt).not.toBeNull();
      expect(data.status).toBe(TicketStatus.CLOSED);
      expect(email.sendTicketReplyEmail).toHaveBeenCalled();
    });

    it('tự chuyển REPLIED khi có reply mà không chỉ định status', async () => {
      jest.spyOn(prisma.ticket, 'findUnique').mockResolvedValue({ id: 't1' });
      jest.spyOn(prisma.ticket, 'update').mockResolvedValue({ id: 't1' });
      await service.update('t1', { reply: 'ok' } as any);
      expect(prisma.ticket.update.mock.calls[0][0].data.status).toBe(TicketStatus.REPLIED);
    });
  });

  describe('reply / close', () => {
    it('reply delegate sang update', async () => {
      const spy = jest.spyOn(service, 'update').mockResolvedValue({ id: 't1' } as any);
      await service.reply('t1', 'hi');
      expect(spy).toHaveBeenCalledWith('t1', { reply: 'hi' });
    });

    it('close delegate sang update với status CLOSED', async () => {
      const spy = jest.spyOn(service, 'update').mockResolvedValue({ id: 't1' } as any);
      await service.close('t1');
      expect(spy).toHaveBeenCalledWith('t1', { status: TicketStatus.CLOSED });
    });
  });
});
