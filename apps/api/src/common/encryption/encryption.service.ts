import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Mã hóa file source (Phase 5 — M2)
 *
 * Thuật toán: AES-256-GCM (authenticated encryption).
 * Format blob lưu trên R2: [iv 12 byte][authTag 16 byte][ciphertext].
 * Key lấy từ env SOURCE_ENCRYPTION_KEY (32 byte = 64 ký tự hex).
 *
 * Mục đích: dù R2 bị lộ, file source vẫn là ciphertext không đọc được
 * nếu không có key. Backend mới decrypt khi user tải hợp lệ.
 */
@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const raw = this.configService.get<string>('SOURCE_ENCRYPTION_KEY');
    if (!raw) {
      throw new Error('Thiếu biến môi trường SOURCE_ENCRYPTION_KEY (cần 32 byte hex)');
    }
    this.key = Buffer.from(raw, 'hex');
    if (this.key.length !== 32) {
      throw new Error('SOURCE_ENCRYPTION_KEY phải là 32 byte (64 ký tự hex)');
    }
  }

  /** Mã hóa plaintext → blob [iv|tag|ciphertext]. */
  encrypt(plain: Buffer): Buffer {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ciphertext]);
  }

  /** Giải mã blob [iv|tag|ciphertext] → plaintext. */
  decrypt(blob: Buffer): Buffer {
    if (blob.length < 28) {
      throw new InternalServerErrorException('Dữ liệu mã hóa không hợp lệ');
    }
    const iv = blob.subarray(0, 12);
    const tag = blob.subarray(12, 28);
    const data = blob.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]);
  }
}
