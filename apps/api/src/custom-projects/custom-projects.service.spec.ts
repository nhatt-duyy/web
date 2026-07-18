import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CustomProjectsService } from './custom-projects.service';
import { PrismaService } from '../database/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { EmailService } from '../common/email/email.service';
import { AuditService } from '../audit/audit.service';
import { ProjectStatus, MilestoneStatus, ProjectFileKind } from '@prisma/client';

describe('CustomProjectsService', () => {
  let service: CustomProjectsService;
  let prisma: any;
  let payments: any;
  let email: any;
  let audit: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomProjectsService,
        {
          provide: PrismaService,
          useValue: {
            customProjectRequest: { findUnique: jest.fn(), create: jest.fn() },
            customProject: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            milestone: {
              count: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              deleteMany: jest.fn(),
              update: jest.fn(),
            },
            payment: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
            projectMessage: { create: jest.fn(), findMany: jest.fn() },
            projectFile: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
            },
            user: { findUnique: jest.fn(), findFirst: jest.fn() },
            $transaction: jest.fn(),
          },
        },
        {
          provide: PaymentsService,
          useValue: { createPaymentLink: jest.fn().mockResolvedValue({ checkoutUrl: 'u', orderCode: 1 }) },
        },
        { provide: EmailService, useValue: { sendCustomRequestNotify: jest.fn(), sendMilestonePaidEmail: jest.fn(), sendProjectUpdateEmail: jest.fn() } },
        { provide: AuditService, useValue: { log: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<CustomProjectsService>(CustomProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
    payments = module.get<PaymentsService>(PaymentsService);
    email = module.get<EmailService>(EmailService);
    audit = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRequest', () => {
    it('tạo request NEW + notify admin', async () => {
      const created = { id: 'r1', title: 'T' };
      jest.spyOn(prisma.customProjectRequest, 'create').mockResolvedValue(created);
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue({ email: 'admin@x.com' });
      expect(
        await service.createRequest({ type: 'WEB_APP', title: 'T', description: 'd' } as any, 'u1'),
      ).toBe(created);
      expect(email.sendCustomRequestNotify).toHaveBeenCalled();
    });

    it('lưu contact khi không login', async () => {
      const created = { id: 'r1' };
      jest.spyOn(prisma.customProjectRequest, 'create').mockResolvedValue(created);
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(null);
      await service.createRequest({ type: 'WEB_APP', title: 'T', contactName: 'A', contactEmail: 'a@b.c' } as any);
      const data = prisma.customProjectRequest.create.mock.calls[0][0].data;
      expect(data.contactName).toBe('A');
      expect(data.userId).toBeNull();
    });
  });

  describe('findOne', () => {
    it('throw NotFound nếu không tồn tại', async () => {
      jest.spyOn(prisma.customProject, 'findUnique').mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });

    it('trả project detail', async () => {
      const p = { id: 'p1' };
      jest.spyOn(prisma.customProject, 'findUnique').mockResolvedValue(p);
      expect(await service.findOne('p1')).toBe(p);
    });
  });

  describe('createFromRequest', () => {
    it('throw NotFound nếu request không tồn tại', async () => {
      jest.spyOn(prisma.customProjectRequest, 'findUnique').mockResolvedValue(null);
      await expect(service.createFromRequest('x', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('throw BadRequest nếu đã có project', async () => {
      jest.spyOn(prisma.customProjectRequest, 'findUnique').mockResolvedValue({ id: 'r1' });
      jest.spyOn(prisma.customProject, 'findUnique').mockResolvedValue({ id: 'p1' });
      await expect(service.createFromRequest('r1', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('tạo project từ request', async () => {
      jest.spyOn(prisma.customProjectRequest, 'findUnique').mockResolvedValue({ id: 'r1', title: 'T' });
      jest.spyOn(prisma.customProject, 'findUnique').mockResolvedValue(null);
      const created = { id: 'p1' };
      jest.spyOn(prisma.customProject, 'create').mockResolvedValue(created);
      expect(await service.createFromRequest('r1', 'u1')).toBe(created);
    });
  });

  describe('updateProject', () => {
    it('throw NotFound nếu không tồn tại', async () => {
      jest.spyOn(prisma.customProject, 'findUnique').mockResolvedValue(null);
      await expect(service.updateProject('x', {} as any)).rejects.toThrow(NotFoundException);
    });

    it('log audit + email khi đổi status', async () => {
      jest.spyOn(prisma.customProject, 'findUnique').mockResolvedValue({ id: 'p1', status: ProjectStatus.NEW, user: { email: 'a@b.c' } });
      jest.spyOn(prisma.customProject, 'update').mockResolvedValue({ id: 'p1', userId: 'u1', status: ProjectStatus.IN_PROGRESS, user: { email: 'a@b.c' } });
      await service.updateProject('p1', { status: ProjectStatus.IN_PROGRESS } as any);
      expect(audit.log).toHaveBeenCalled();
      expect(email.sendProjectUpdateEmail).toHaveBeenCalled();
    });
  });

  describe('addMilestone', () => {
    it('throw NotFound nếu project không tồn tại', async () => {
      jest.spyOn(prisma.customProject, 'findUnique').mockResolvedValue(null);
      await expect(service.addMilestone('p1', { name: 'M' } as any)).rejects.toThrow(NotFoundException);
    });

    it('tạo milestone PENDING với sortOrder = count', async () => {
      jest.spyOn(prisma.customProject, 'findUnique').mockResolvedValue({ id: 'p1' });
      jest.spyOn(prisma.milestone, 'count').mockResolvedValue(2);
      const created = { id: 'm1' };
      jest.spyOn(prisma.milestone, 'create').mockResolvedValue(created);
      expect(await service.addMilestone('p1', { name: 'M', amount: 100 } as any)).toBe(created);
      expect(prisma.milestone.create.mock.calls[0][0].data.status).toBe(MilestoneStatus.PENDING);
      expect(prisma.milestone.create.mock.calls[0][0].data.sortOrder).toBe(2);
    });
  });

  describe('getDebtSummary', () => {
    it('tính total/paid/remaining', async () => {
      const milestones = [
        { id: 'm1', amount: 100, status: MilestoneStatus.PAID, paidAt: null },
        { id: 'm2', amount: 50, status: MilestoneStatus.PENDING, paidAt: null },
      ];
      jest.spyOn(prisma.milestone, 'findMany').mockResolvedValue(milestones);
      const summary = await service.getDebtSummary('p1');
      expect(summary.total).toBe(150);
      expect(summary.paid).toBe(100);
      expect(summary.remaining).toBe(50);
    });
  });

  describe('sendMessage / addFile / getFiles', () => {
    it('sendMessage tạo message', async () => {
      jest.spyOn(prisma.customProject, 'findUnique').mockResolvedValue({ id: 'p1' });
      const msg = { id: 'msg1' };
      jest.spyOn(prisma.projectMessage, 'create').mockResolvedValue(msg);
      expect(await service.sendMessage('p1', 'u1', true, { content: 'hi' } as any)).toBe(msg);
    });

    it('addFile auto-increment version cho deliverable', async () => {
      jest.spyOn(prisma.customProject, 'findUnique').mockResolvedValue({ id: 'p1' });
      jest.spyOn(prisma.projectFile, 'findFirst').mockResolvedValue({ version: 2 });
      const created = { id: 'f1' };
      jest.spyOn(prisma.projectFile, 'create').mockResolvedValue(created);
      await service.addFile('p1', 'u1', { name: 'x.zip', fileKey: 'k', kind: ProjectFileKind.DELIVERABLE });
      expect(prisma.projectFile.create.mock.calls[0][0].data.version).toBe(3);
    });

    it('getFiles trả files kèm uploader', async () => {
      jest.spyOn(prisma.projectFile, 'findMany').mockResolvedValue([{ id: 'f1' }]);
      expect(await service.getFiles('p1')).toEqual([{ id: 'f1' }]);
    });
  });

  describe('markMilestonePaid', () => {
    it('throw NotFound nếu payment không link milestone', async () => {
      jest.spyOn(prisma.payment, 'findUnique').mockResolvedValue({ id: 'pay1', milestoneId: null });
      await expect(service.markMilestonePaid('pay1')).rejects.toThrow(NotFoundException);
    });

    it('idempotent nếu đã PAID', async () => {
      const milestone = { id: 'm1', status: MilestoneStatus.PAID, project: { user: { email: 'a@b.c' }, userId: 'u1', title: 'T' } };
      jest.spyOn(prisma.payment, 'findUnique').mockResolvedValue({ id: 'pay1', milestoneId: 'm1', milestone });
      expect(await service.markMilestonePaid('pay1')).toBe(milestone);
      expect(prisma.milestone.update).not.toHaveBeenCalled();
    });

    it('đánh dấu PAID + audit khi chưa thu', async () => {
      const milestone = { id: 'm1', status: MilestoneStatus.INVOICED, project: { user: { email: 'a@b.c' }, userId: 'u1', title: 'T' } };
      jest.spyOn(prisma.payment, 'findUnique').mockResolvedValue({ id: 'pay1', milestoneId: 'm1', milestone });
      jest.spyOn(prisma, '$transaction').mockResolvedValue([]);
      await service.markMilestonePaid('pay1');
      expect(prisma.milestone.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: MilestoneStatus.PAID }) }),
      );
      expect(audit.log).toHaveBeenCalled();
    });
  });
});
