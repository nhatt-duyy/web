# KẾ HOẠCH PHASE 5 — SECURITY HARDENING (License, Watermark, Encrypted Download, Audit)

> **Dự án**: Nhat Duy Market (web sourceban) — Marketplace source code + Custom Dev
> **Phase**: 5 — Security Hardening (Tuần 17-18 theo kế hoạch)
> **Ngày soạn**: 2026-07-16
> **Dựa trên**: `docs/security-plan.md` (Phase 0 deliverable) + các feat commit đã thực hiện

---

## 1. CONTEXT (Tại sao làm Phase 5)

Phase 0→4 đã hoàn thành (MVP → Marketplace → Admin → Custom Dev). Trước Phase 6 (QA/UAT) và Phase 7 (launch), cần **siết chặt bảo mật** để:

- **Chống rò rỉ source code** — tài sản cốt lõi của marketplace.
- **Bảo vệ license** — ngăn bypass, share chéo, kích hoạt trái phép.
- **Truy vết nguồn rò rỉ** — khi source lộ ra ngoài, biết ai là người mua.
- **Ghi nhận hành vi nhạy cảm** — audit log bất biến phục vụ điều tra & tuân thủ.

Mục tiêu: đạt **Definition of Done** của Phase 5 → sẵn sàng QA/UAT.

---

## 2. HIỆN TRẠNG (Đã làm thực tế — theo git)

| Hạng mục | Commit | Chi tiết |
|----------|--------|---------|
| **Audit log** | `9325c49` | Ghi nhận hành động nhạy cảm (login, order, download, role change) + API admin xem/sạch audit (M4) |
| **Rate limit** | `f85d8bf` | Chặn brute-force login & spam download; **exempt webhook PayOS** (không bị throttle) |
| **License key** | `ff057f0` | Format có checksum (CRC16), verify API, revoke |
| **Encrypted download** | `dc8de8d` | AES-256-GCM + stream-decrypt khi tải |
| **Watermark** | `a7a7dd1` | Gắn `WATERMARK.txt` truy vết khi tải source |
| **Giới hạn tải** | `ca508ea` (Phase 2) | Giới hạn 5 lượt/lần + reset định kỳ theo license |
| **Đơn 0đ** | `4f44cc2` | Sản phẩm miễn phí cấp license luôn, không cần thanh toán |

> Tham khảo thiết kế chi tiết tại `docs/security-plan.md` (M5: Full license enforcement, Watermarking v2, Anomaly detection, OWASP scan pass).

---

## 3. DEFINITION OF DONE (Phase 5)

- [x] **License key**: format `LIC-...-XXXX` có checksum, verify API trả về trạng thái, revoke hoạt động.
- [x] **Encrypted download**: file lưu trên R2 đã mã hóa AES-256-GCM; khi tải về được stream-decrypt realtime.
- [x] **Watermark**: mỗi lượt tải gắn `WATERMARK.txt` chứa license key + user email để truy vết.
- [x] **Audit log**: ghi đầy đủ hành vi nhạy cảm; admin có API liệt kê & filter.
- [x] **Rate limit**: login (5 req/phút/IP), download (5 req/phút/user); webhook PayOS được miễn trừ.
- [x] **Unit test**: spec cho license service (checksum, verify, revoke, watermark), đạt xanh.
- [x] **CI**: API jest + web vitest xanh (được củng cố ở Phase 6).

---

## 4. WORKSTREAM CHI TIẾT

### W1. License Key + Checksum (`ff057f0`)
- **Format**: `LIC-{uuid}-{CRC16(payload)}` — payload = uuid + productId + userId.
- **Verify API** `POST /licenses/:key/verify`: validate format, checksum, status=ACTIVE, domain/IP bind.
- **Revoke** `POST /licenses/:id/revoke`: admin thu hồi → status=REVOKED → tải về trả 403.
- **File**: `apps/api/src/licenses/licenses.service.ts`, `licenses.controller.ts`.

### W2. Encrypted Download (`dc8de8d`)
- Upload: source zip mã hóa AES-256-GCM (96-bit nonce, 128-bit tag) trước khi lên R2.
- Download: `GET /licenses/:id/download` → stream-decrypt realtime → trả file plaintext cho user hợp lệ.
- Check: status ACTIVE, downloadCount < max, chưa hết hạn.
- **File**: `apps/api/src/storage/`, `apps/api/src/common/encryption/`.

### W3. Watermark (`a7a7dd1`)
- Mỗi lượt tải: inject `WATERMARK.txt` chứa `{ licenseKey, userEmail, timestamp }` vào gói zip trước khi stream về.
- Dùng buffer chứa `USER_EMAIL` để test a11y/spec phát hiện được dấu vết.
- **File**: `apps/api/src/common/watermark/`.

### W4. Audit Log (`9325c49`)
- Schema `AuditLog` (Prisma): userId, action enum, entityType, entityId, oldData, newData, ip, userAgent.
- Service ghi log tại các điểm nhạy cảm (login, order confirm, download, role change, revoke).
- API admin: `GET /admin/audit` (filter theo action/user/entity), cleanup.
- **File**: `apps/api/src/audit/`.

### W5. Rate Limit (`f85d8bf`)
- ThrottlerGuard global: login 5/phút/IP, download 5/phút/user, API chung 100/phút/user.
- PayOS webhook **exempt** khỏi throttle (tránh bỏ lỡ callback thanh toán).
- **File**: `apps/api/src/common/guards/throttler.guard.ts`.

---

## 5. FILES ĐÃ THAY ĐỔI

| File | Thay đổi |
|------|----------|
| `apps/api/src/licenses/licenses.service.ts` | logic key, verify, revoke, download |
| `apps/api/src/licenses/licenses.service.spec.ts` | spec (checksum, verify, revoke, watermark) |
| `apps/api/src/storage/*` | signed URL + upload encrypt |
| `apps/api/src/common/encryption/*` | AES-256-GCM helpers |
| `apps/api/src/common/watermark/*` | WATERMARK.txt injection |
| `apps/api/src/audit/*` | audit log service + controller |
| `apps/api/src/common/guards/throttler.guard.ts` | rate limit + exempt webhook |
| `prisma/schema.prisma` | model AuditLog, License status/limit fields |

---

## 6. RỦI RO & LƯU Ý

| Rủi ro | Mitigation |
|--------|-----------|
| Decrypt sai key → file hỏng | Verify SHA-256 trước/sau; test coverage spec |
| Watermark lộ trên UI | Chỉ gắn vào file zip tải về, không hiển thị |
| Rate limit sai → khóa user thật | Whitelist webhook, tuning threshold thử nghiệm |
| Audit log phình to | Index hợp lý, cleanup job định kỳ (Phase 7) |

---

## 7. LIÊN KẾT

- Thiết kế gốc: `docs/security-plan.md` (M4 Audit, M5 License/Watermark)
- Kế tiếp: `2026-07-16-phase-6-qa-uat.md` (QA, Perf, A11y, UAT)
- UAT checklist: `docs/uat-phase6.md` (kịch bản Phase 5 end-to-end)
