import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../database/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: {
            auditLog: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should write audit log với default null fields', async () => {
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({ id: '1' });
      await service.log({ action: 'LOGIN', entity: 'User', entityId: 'u-1' });
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: null,
          action: 'LOGIN',
          entity: 'User',
          entityId: 'u-1',
          ip: null,
          meta: undefined,
        },
      });
    });

    it('should swallow error (audit là side-effect, không ném lên)', async () => {
      jest.spyOn(prisma.auditLog, 'create').mockRejectedValue(new Error('db down'));
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(service.log({ action: 'X' })).resolves.toBeUndefined();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('findAll', () => {
    it('should paginate và filter theo action', async () => {
      const data = [{ id: '1' }];
      jest.spyOn(prisma, '$transaction').mockResolvedValue([data, 1]);
      const result = await service.findAll({ action: 'LOGIN', page: 2, limit: 5 });
      expect(result).toEqual({ data, total: 1, page: 2, limit: 5 });
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { action: 'LOGIN' },
        orderBy: { createdAt: 'desc' },
        skip: 5,
        take: 5,
      });
    });

    it('should clamp page/limit về min 1 / max 100', async () => {
      jest.spyOn(prisma, '$transaction').mockResolvedValue([[], 0]);
      await service.findAll({ page: 0, limit: 999 });
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 100 }),
      );
    });
  });
});
