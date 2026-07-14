import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../common/email/email.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  } as any;
  const mockJwtService = { sign: jest.fn().mockReturnValue('token') };
  const mockEmailService = { sendResetPasswordEmail: jest.fn(), sendVerificationEmail: jest.fn() };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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

  it('login trả về access_token khi credentials hợp lệ', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: '1',
      email: 'a@b.c',
      passwordHash: 'hashed',
      role: 'CUSTOMER',
    });
    const bcryptSpy = jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true);
    const res = await service.login({ email: 'a@b.c', password: 'secret1' });
    expect(res.access_token).toBe('token');
    bcryptSpy.mockRestore();
  });

  it('login ném UnauthorizedException khi sai credentials', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login({ email: 'a@b.c', password: 'wrong' }))
      .rejects.toThrow('Sai thông tin');
  });

  describe('forgotPassword', () => {
    it('should do nothing if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await service.forgotPassword('nonexistent@test.com');
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockEmailService.sendResetPasswordEmail).not.toHaveBeenCalled();
    });

    it('should generate token and send email if user exists', async () => {
      const user = { email: 'test@test.com' };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(user);
      const cryptoStub = jest.spyOn(require('crypto'), 'randomBytes');
      cryptoStub.mockReturnValueOnce({ toString: jest.fn().mockReturnValue('faketoken') } as any);
      const now = Date.now();
      jest.useFakeTimers();
      jest.setSystemTime(now);
      await service.forgotPassword('test@test.com');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
        data: {
          resetToken: 'faketoken',
          resetExpires: expect.any(Date),
        },
      });
      const call = mockPrisma.user.update.mock.calls[0];
      expect(call[0].data.resetToken).toBe('faketoken');
      expect(call[0].data.resetExpires.getTime()).toBe(now + 1000 * 60 * 30);
      expect(mockEmailService.sendResetPasswordEmail).toHaveBeenCalledWith('test@test.com', 'faketoken');
      jest.useRealTimers();
      cryptoStub.mockRestore();
    });
  });

  describe('resetPassword', () => {
    it('should throw UnauthorizedException if token invalid or expired', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(service.resetPassword('invalidtoken', 'newpass')).rejects.toThrow(UnauthorizedException);
      mockPrisma.user.findFirst.mockResolvedValue({
        resetExpires: new Date(Date.now() - 1000), // expired
      });
      await expect(service.resetPassword('expiredtoken', 'newpass')).rejects.toThrow(UnauthorizedException);
    });

    it('should reset password if token valid', async () => {
      const user = {
        id: '1',
        resetToken: 'validtoken',
        resetExpires: new Date(Date.now() + 1000 * 60 * 30), // future
      };
      mockPrisma.user.findFirst.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(user);
      const bcryptSpy = jest.spyOn(require('bcryptjs'), 'hash').mockResolvedValue('hashedpass');
      const result = await service.resetPassword('validtoken', 'newpass');
      expect(result).toEqual({ success: true });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          passwordHash: 'hashedpass',
          resetToken: null,
          resetExpires: null,
        },
      });
      bcryptSpy.mockRestore();
    });
  });

  describe('sendVerifyEmail', () => {
    it('should do nothing if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await service.sendVerifyEmail('nonexistent@test.com');
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should generate token and send email if user exists', async () => {
      const user = { email: 'test@test.com', id: '1' };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(user);
      const cryptoStub = jest.spyOn(require('crypto'), 'randomBytes');
      cryptoStub.mockReturnValueOnce({ toString: jest.fn().mockReturnValue('verifytoken') } as any);
      const now = Date.now();
      jest.useFakeTimers();
      jest.setSystemTime(now);
      await service.sendVerifyEmail('test@test.com');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
        data: {
          verificationToken: 'verifytoken',
          verificationExpires: expect.any(Date),
        },
      });
      const call = mockPrisma.user.update.mock.calls[0];
      expect(call[0].data.verificationToken).toBe('verifytoken');
      expect(call[0].data.verificationExpires.getTime()).toBe(now + 1000 * 60 * 60);
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith('test@test.com', 'verifytoken');
      jest.useRealTimers();
      cryptoStub.mockRestore();
    });
  });

  describe('verifyEmail', () => {
    it('should throw UnauthorizedException if token invalid or expired', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(service.verifyEmail('invalidtoken')).rejects.toThrow(UnauthorizedException);
      mockPrisma.user.findFirst.mockResolvedValue({
        verificationExpires: new Date(Date.now() - 1000), // expired
      });
      await expect(service.verifyEmail('expiredtoken')).rejects.toThrow(UnauthorizedException);
    });

    it('should verify email if token valid', async () => {
      const user = {
        id: '1',
        verificationToken: 'validtoken',
        verificationExpires: new Date(Date.now() + 1000 * 60 * 60), // future
      };
      mockPrisma.user.findFirst.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(user);
      const result = await service.verifyEmail('validtoken');
      expect(result).toEqual({ success: true });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          emailVerifiedAt: expect.any(Date),
          verificationToken: null,
          verificationExpires: null,
        },
      });
    });
  });
});