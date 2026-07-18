# Phase 6 — Báo cáo Load Test (Download Path)

> **Mục tiêu**: Đường dẫn tải source code (watermark) phải chịu được **≥ 50 RPS**
> không sinh lỗi 5xx, với **p95 latency < 500ms**.

---

## 1. Kịch bản

- **Công cụ**: [k6](https://k6.io/) (`scripts/load-test-download.js`)
- **Executor**: `constant-arrival-rate` — 50 request/giây, duration 1 phút
- **Pre-allocated VUs**: 50, **max VUs**: 100
- **Luồng**: `setup()` login lấy JWT + 1 license id → `default()` gọi
  `GET /licenses/:id/download` với header `Authorization: Bearer <token>`

## 2. Thresholds (tiêu chí đạt)

| Metric | Điều kiện | Ý nghĩa |
|--------|-----------|---------|
| `http_req_duration` | `p(95) < 500` | p95 latency < 500ms |
| `server_errors_5xx` | `rate < 0.05` | Tỷ lệ 5xx < 5% |

## 3. Cách chạy

```bash
# Yêu cầu: API đang chạy + DB + R2 (docker-compose stack)
# Seed account test + 1 license hợp lệ trước khi chạy

export BASE_URL=http://localhost:3001
export TEST_EMAIL=test@example.com
export TEST_PASSWORD=test-password
export TEST_LICENSE_ID=lic_xxxxx   # optional, auto-fetch nếu thiếu

k6 run scripts/load-test-download.js
```

## 4. Kết quả (dự kiến / cần ghi nhận trên môi trường staging)

> ⚠️ **Local không thể chạy**: môi trường dev (WSL) không có Docker để boot
> toàn bộ stack (API + PostgreSQL + MeiliSearch + MinIO/R2). Kịch bản dưới đây
> là kết quả kỳ vọng và SẼ được thực thi trên CI/staging có docker-compose.

| Chỉ số | Kỳ vọng | Thực tế |
|--------|---------|---------|
| Total requests (60s @ 50 RPS) | ~3000 | — |
| Request rate | 50/s | — |
| p95 latency | < 500ms | — |
| 5xx rate | < 5% | — |
| Checks passed | 100% | — |

## 5. Điểm nghẽn tiềm năng & mitigation

1. **R2 presigned URL generation** — mỗi download gọi S3 SDK.
   Mitigation: cache presigned URL 5 phút theo `(licenseId, userId)`.
2. **Watermark (JSZip)** — nặng CPU nếu file lớn.
   Mitigation: stream + zip incremental, giới hạn size; chạy trên worker riêng.
3. **DB connection pool** — NestJS Prisma mặc định pool 5–10.
   Mitigation: tăng `connection_limit` trong `DATABASE_URL` trên staging.

## 6. Trạng thái

- [x] Script k6 sẵn sàng (`scripts/load-test-download.js`)
- [x] Thresholds định nghĩa (p95<500ms, 5xx<5%)
- [ ] Chạy thực tế trên staging (chờ docker-compose / deploy)
- [ ] Ghi nhận kết quả thực tế vào bảng trên
