import { randomBytes } from 'crypto';

/**
 * License Key có cấu trúc (Phase 5 — M1)
 *
 * Format: SB-XXXX-XXXX-XXXX-CCCC
 *  - "SB" : tiền tố thương hiệu (SourceBan)
 *  - 3 nhóm XXXX : 12 ký tự hex ngẫu nhiên (payload)
 *  - CCCC : checksum CRC16 của phần payload (đã gồm tiền tố) — cho phép
 *           xác minh nhanh (offline) một key có bị gõ sai / bịa hay không
 *           TRƯỚC khi truy vấn DB.
 *
 * Lưu ý: checksum KHÔNG phải chữ ký bảo mật (không chống giả mạo bằng
 * cách tự tính lại). Nó chỉ lọc key rác. Việc xác thực thật sự (tồn tại,
 * ACTIVE, chưa hết hạn) do verifyKey() trong LicensesService đảm nhiệm.
 */

const PREFIX = 'SB';
const KEY_REGEX = /^SB-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/;

/** CRC16-CCITT (0xFFFF) — nhẹ, đủ để bắt lỗi gõ sai. */
function crc16(input: string): number {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc & 0xffff;
}

/** Phần dữ liệu dùng để tính checksum: tiền tố + 3 nhóm payload (không dấu gạch). */
function checksumSource(prefix: string, groups: string[]): string {
  return prefix + groups.join('');
}

/** Sinh license key mới, format SB-XXXX-XXXX-XXXX-CCCC (hex uppercase). */
export function generateLicenseKey(): string {
  // 6 byte -> 12 hex ký tự -> chia 3 nhóm 4 ký tự
  const hex = randomBytes(6).toString('hex').toUpperCase(); // 12 ký tự
  const groups = [hex.slice(0, 4), hex.slice(4, 8), hex.slice(8, 12)];
  const checksum = crc16(checksumSource(PREFIX, groups))
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  return `${PREFIX}-${groups[0]}-${groups[1]}-${groups[2]}-${checksum}`;
}

/** Kiểm tra định dạng + checksum (không truy vấn DB). */
export function isValidLicenseKeyFormat(key: string): boolean {
  if (typeof key !== 'string' || !KEY_REGEX.test(key)) return false;
  const parts = key.split('-'); // [SB, g1, g2, g3, checksum]
  const groups = [parts[1], parts[2], parts[3]];
  const expected = crc16(checksumSource(PREFIX, groups))
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  return expected === parts[4];
}
