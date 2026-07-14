import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  const mockPrisma = { user: { findUnique: jest.fn(), create: jest.fn() } } as any;
  const mockJwtService = { sign: jest.fn().mockReturnValue('token') };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('register trả về access_token khi email mới', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: '1', email: 'a@b.c', role: 'CUSTOMER' });
    const res = await service.register({ email: 'a@b.c', password: 'secret1', name: 'A' });
    expect(res.access_token).toBe('token');
  });

  it('register ném ConflictException khi email trùng', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });
    await expect(service.register({ email: 'a@b.c', password: 'secret1', name: 'A' }))
      .rejects.toThrow('Email đã tồn tại');
  });
});