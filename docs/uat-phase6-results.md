# Phase 6 — Kết quả UAT (User Acceptance Testing)

> **Tham chiếu**: `docs/uat-phase6.md` (checklist 9 kịch bản Phase 5 security)
> **Ngày**: 2026-07-18
> **Người thực hiện**: QA / Claude (automated)
> **Môi trường**: Local dev (WSL, **không có Docker**) + unit test coverage

---

## ⚠️ Hạn chế môi trường

Môi trường dev (WSL) **không có Docker** → không thể boot toàn bộ stack
(API + PostgreSQL + MeiliSearch + MinIO/R2) để chạy E2E thủ công end-to-end.
Do đó:

- **Unit/Integration tests** (NestJS Jest, coverage **81.88%** lines, 193 tests)
  đã xác minh logic nghiệp vụ của các tính năng Phase 5 (M1–M5).
- **Manual UAT** (9 kịch bản) cần chạy trên **staging có docker-compose** —
  đánh dấu `⏳ Chờ staging` và cung cấp lệnh verify sẵn sàng trong `uat-phase6.md`.

---

## Bảng kết quả

| # | Kịch bản | Trạng thái | Bằng chứng |
|---|----------|------------|-----------|
| 1 | Đăng ký / Đăng nhập | ⏳ Chờ staging | `auth` E2E (render + OAuth buttons) pass; login sai → `role=alert` covered |
| 2 | Marketplace → Search → Chi tiết | ⏳ Chờ staging | `browse` E2E pass (home/products/detail render) |
| 3 | Cart → PayOS → Webhook → License | ⏳ Chờ staging | `orders.service.spec` confirmPayment→license.create+audit PASS covered |
| 4 | Tải source có WATERMARK.txt | ⏳ Chờ staging | `licenses.service.spec` download (watermark path) covered |
| 5 | Verify license valid / BAD_FORMAT | ✅ Unit pass | `licenses.service.spec` verify logic covered |
| 6 | Admin revoke → User 403 | ✅ Unit pass | `licenses.service.spec` REVOKED→Forbidden covered |
| 7 | Rate limit (Auth/Download/Webhook) | ⏳ Chờ staging | Throttle guard logic đã có; cần E2E burst test |
| 8 | Audit log đủ hành động | ✅ Unit pass | `audit.service` + ORDER_PAID/License log covered |
| 9 | Bảo mật file R2 (.enc/presigned) | ✅ Unit pass | `storage.service.spec` getObjectBuffer/putObjectBuffer/presigned covered |

---

## Chi tiết từ Unit Tests (thay thế UAT manual trên local)

| Tính năng Phase 5 | Test đã pass | File |
|-------------------|--------------|------|
| License download + watermark + rate-limit | `findAllForUser`, `findOneForUser`, `download` (streamUrl, increment, audit, REVOKED→403, over-limit→403, 30-day reset, no-fileKey→404), `resetExpiredDownloads` | `licenses.service.spec.ts` |
| Encrypted storage (R2) | `getObjectBuffer`, `putObjectBuffer`, `getPresignedUploadUrl` | `storage.service.spec.ts` |
| Auto license trên PAID | `confirmPayment` tạo license/item + audit ORDER_PAID; P2002 skip | `orders.service.spec.ts` |
| Audit log | log action/entity/entityId | `audit.service.spec.ts` (integration) |

---

## Kế hoạch chạy UAT thủ công trên staging

```bash
# 1. Boot stack
docker-compose -f infrastructure/docker/docker-compose.yml up -d
pnpm --filter api dev &   # API :3001
pnpm --filter web dev &   # Web :3000

# 2. Seed account test + 1 license
# (chạy scripts/seed hoặc manual)

# 3. Run E2E playwright (web-only specs pass; backend specs cần env)
E2E_DL_USER=qa@test.dev E2E_DL_PASS=Test@123 \
E2E_ADMIN_USER=admin@test.dev E2E_ADMIN_PASS=Admin@123 \
E2E_LICENSE_ID=lic_xxx \
pnpm --filter web e2e:ci

# 4. Chạy 9 kịch bản trong docs/uat-phase6.md, tick vào bảng tổng kết
```

---

## Kết luận

- ✅ **Logic Phase 5 đã được unit/integration test phủ** (API 81.88%).
- ⏳ **9 kịch bản UAT thủ công chờ staging** (Docker unavailable local).
- 🚦 **Sẵn sàng Phase 7 (Launch) về mặt test coverage**; UAT manual là bước
  xác nhận cuối trên môi trường staging trước khi go-live.

**Người UAT**: Claude (automated)  **Ngày**: 2026-07-18  **Môi trường**: local dev + unit
