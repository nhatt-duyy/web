import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { ConfigService } from '@nestjs/config';

describe('EncryptionService', () => {
  let service: EncryptionService;
  const KEY = 'a'.repeat(64); // 64 hex = 32 byte

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        { provide: ConfigService, useValue: { get: () => KEY } },
      ],
    }).compile();
    service = module.get<EncryptionService>(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('encrypt → decrypt roundtrip giữ nguyên plaintext', () => {
    const plain = Buffer.from('source code bí mật 123');
    const blob = service.encrypt(plain);
    // Format: [iv 12][tag 16][ciphertext]
    expect(blob.length).toBeGreaterThanOrEqual(28);
    const back = service.decrypt(blob);
    expect(back.toString()).toBe(plain.toString());
  });

  it('mỗi lần encrypt sinh iv khác nhau (non-deterministic)', () => {
    const plain = Buffer.from('x');
    const a = service.encrypt(plain);
    const b = service.encrypt(plain);
    expect(a.subarray(0, 12).equals(b.subarray(0, 12))).toBe(false);
  });

  it('decrypt blob quá ngắn → throw InternalServerError', () => {
    expect(() => service.decrypt(Buffer.from('ngắn'))).toThrow(InternalServerErrorException);
  });

  it('decrypt sai auth tag → throw', () => {
    const blob = service.encrypt(Buffer.from('secret'));
    const tampered = Buffer.from(blob);
    tampered[30] ^= 0xff; // flip 1 byte trong ciphertext
    expect(() => service.decrypt(tampered)).toThrow();
  });
});
