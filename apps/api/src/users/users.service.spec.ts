import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../database/prisma.service';
import { Role } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;

  const mockTx = (findMany: any, count: any) => jest.fn().mockResolvedValue([findMany, count]);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn(),
            order: { findMany: jest.fn() },
            license: { findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('phân trang + trả total', async () => {
      const users = [{ id: 'u1' }];
      jest.spyOn(prisma, '$transaction').mockImplementation(mockTx(users, 1));
      const result = await service.findAll({ page: 2, limit: 5 });
      expect(result).toEqual({ data: users, total: 1, page: 2, limit: 5 });
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5, orderBy: { createdAt: 'desc' } }),
      );
    });

    it('lọc theo role + isActive + search (OR)', async () => {
      jest.spyOn(prisma, '$transaction').mockImplementation(mockTx([], 0));
      await service.findAll({ email: 'a@b.c', role: Role.ADMIN, isActive: true });
      const where = prisma.user.findMany.mock.calls[0][0].where;
      expect(where.role).toBe(Role.ADMIN);
      expect(where.isActive).toBe(true);
      expect(where.OR).toEqual([
        { email: { contains: 'a@b.c', mode: 'insensitive' } },
      ]);
    });
  });

  describe('findOne', () => {
    it('trả detail kèm include', async () => {
      const user = { id: 'u1' };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(user);
      expect(await service.findOne('u1')).toBe(user);
    });

    it('throw NotFound nếu không tồn tại', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('changeRole', () => {
    it('throw BadRequest nếu tự đổi chính mình', async () => {
      await expect(service.changeRole('u1', Role.STAFF, 'u1')).rejects.toThrow(
        'Bạn không thể tự đổi vai trò của chính mình',
      );
    });

    it('throw NotFound nếu user không tồn tại', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      await expect(service.changeRole('x', Role.STAFF, 'admin')).rejects.toThrow(NotFoundException);
    });

    it('update role thành công', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 'u1' });
      const updated = { id: 'u1', role: Role.STAFF };
      jest.spyOn(prisma.user, 'update').mockResolvedValue(updated);
      expect(await service.changeRole('u1', Role.STAFF, 'admin')).toBe(updated);
    });
  });

  describe('setActive', () => {
    it('throw BadRequest nếu tự khóa chính mình', async () => {
      await expect(service.setActive('u1', false, 'u1')).rejects.toThrow(
        'Bạn không thể tự khóa/mở tài khoản của chính mình',
      );
    });

    it('update isActive thành công', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 'u1' });
      const updated = { id: 'u1', isActive: false };
      jest.spyOn(prisma.user, 'update').mockResolvedValue(updated);
      expect(await service.setActive('u1', false, 'admin')).toBe(updated);
    });
  });

  describe('findUserOrders / findUserLicenses', () => {
    it('findUserOrders trả orders kèm items', async () => {
      const orders = [{ id: 'o1' }];
      jest.spyOn(prisma.order, 'findMany').mockResolvedValue(orders);
      expect(await service.findUserOrders('u1')).toBe(orders);
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1' } }),
      );
    });

    it('findUserLicenses trả licenses kèm product', async () => {
      const lic = [{ id: 'l1' }];
      jest.spyOn(prisma.license, 'findMany').mockResolvedValue(lic);
      expect(await service.findUserLicenses('u1')).toBe(lic);
    });
  });
});
