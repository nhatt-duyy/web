# KẾ HOẠCH PHASE 6 — QA, PERFORMANCE, ACCESSIBILITY & UAT

> **Dự án**: Nhat Duy Market (web sourceban) — Marketplace source code + Custom Dev
> **Phase**: 6 — Kiểm thử & Tối ưu (Tuần 19-20 theo kế hoạch)
> **Ngày soạn**: 2026-07-16
> **Quyết định user**: Làm **toàn diện (nặng)** — cả 4 hạng mục:
> 1. Automated testing (CI + coverage)
> 2. E2E Playwright
> 3. Perf + Lighthouse CI
> 4. Thực thi UAT Phase 5

---

## 1. CONTEXT (Tại sao làm Phase 6)

Phase 0→5 đã hoàn thành (MVP → Security hardening). Trước khi **Phase 7 (Production Launch)**, cần:
- Đảm bảo mọi tính năng hoạt động ổn định qua **automated test + CI xanh**
- Đảm bảo **performance** đủ tốt (Lighthouse) và **accessibility** tuân thủ WCAG 2.2
- **UAT end-to-end** thực thi trên staging/local để bắt lỗi luồng thực tế trước go-live

Mục tiêu: Phase 6 đạt **Definition of Done** → sẵn sàng Phase 7.

---

## 2. HIỆN TRẠNG (Đã có / Thiếu)

### ✅ Đã có
| Hạng mục | Chi tiết |
|----------|---------|
| API unit test | Jest + ts-jest, **44 tests / 7 suites** (auth, orders, payments, products, licenses, categories, storage) |
| Web component test | Vitest + @testing-library + vitest-axe, **11 tests / 3 files** (CheckoutButton, LicenseList, ProductCard) |
| CI | `ci.yml`: job `build` (lint+build) + job `test` (Postgres service + API jest) |
| UAT checklist | `docs/uat-phase6.md` đã soạn sẵn (kịch bản Phase 5) |
| A11y cơ bản | Component-level `toHaveNoViolations` đã có |

### ❌ Thiếu (Khoảng trống Phase 6)
| Hạng mục | Chi tiết |
|----------|---------|
| Web trong CI | CI **chỉ chạy API test**. Web build + vitest **chưa có** trong pipeline |
| Coverage gate | `collectCoverageFrom` từng có nhưng block jest bị xóa; **chưa enforce threshold** |
| API test thiếu module | Chưa có spec: audit, coupons, reviews, custom-projects, search, stats, tickets, users |
| E2E | **Chưa có** Playwright — luồng browse→buy→download chưa auto test |
| Perf | **Chưa có** Lighthouse CI / load test |
| Full-page a11y | Mới component-level; thiếu audit toàn trang (navigation, forms, contrast) |

---

## 3. DEFINITION OF DONE (Phase 6)

- [ ] CI xanh 100%: API test + Web build + Web vitest + (Lighthouse) đều pass trên push/PR
- [ ] Coverage API ≥ **70%** (line), Web component ≥ **60%** — có badge/report
- [ ] E2E Playwright: ít nhất 5 kịch bản critical pass (auth, browse, cart, checkout, download)
- [ ] Lighthouse CI: Performance ≥ 80, Accessibility ≥ 90, Best-Practices ≥ 90, SEO ≥ 90 (mobile)
- [ ] Load test API download path: ≥ 50 RPS không lỗi 5xx
- [ ] UAT Phase 5: thực thi toàn bộ kịch bản `docs/uat-phase6.md`, ghi Pass/Fail, fix mọi lỗi tìm thấy
- [ ] Tài liệu UAT result + perf report lưu trong `docs/`

---

## 4. WORKSTREAM A — AUTOMATED TESTING (CI + COVERAGE)

### A1. Thêm Web vào CI
**File**: `.github/workflows/ci.yml`
- Thêm step trong job `test` (hoặc job mới `web-test`):
  ```yaml
  - run: pnpm --filter web exec prisma generate   # nếu web cần types
  - run: pnpm --filter web build
  - run: pnpm --filter web test
  ```
- Đảm bảo web build không fail do env thiếu → dùng `.env.example` hoặc mock env trong CI (Next.js build cần `NEXTAUTH_SECRET` etc. → set dummy trong `env:` của CI).

### A2. Bật Coverage + Threshold
**File**: `apps/api/jest.config.js` (thêm vào preset ts-jest):
```js
collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/main.ts'],
coverageThreshold: { './src': { lines: 70 } },
```
**File**: `apps/web/vitest.config.ts` (thêm `coverage`):
```ts
test: {
  coverage: {
    provider: 'v8',
    thresholds: { lines: 60 },
    exclude: ['**/*.test.*', '**/.next/**'],
  },
}
```
- Chạy local verify: `pnpm --filter api test --coverage` và `pnpm --filter web test --coverage`.

### A3. Viết thêm API spec cho module thiếu
Viết unit test (service-level, mock Prisma) cho:
- `audit.service.spec.ts` — log + findAll filter
- `coupons.service.spec.ts` — validate, apply
- `reviews.service.spec.ts` — create + admin approve
- `custom-projects.service.spec.ts` — create request, milestones, messages
- `tickets.service.spec.ts` — create, assign, close
- `users.service.spec.ts` — CRUD, role change
- (Tùy thời gian) `search.service.spec.ts`, `stats.service.spec.ts`

**Pattern tái sử dụng**: copy pattern từ `products.service.spec.ts` (đã PASS) — `useValue` mock object với `jest.fn()` cho từng Prisma delegate + service dependency. Xem `apps/api/src/products/products.service.spec.ts:15-58`.

### A4. Viết thêm Web component test
Mở rộng từ 3 file hiện có, thêm test cho components chưa cover:
- `ProductCard` (đã có) → thêm test variant
- `cart` components, `checkout` components, `dashboard` components
- Mỗi component test gồm: render + a11y (`toHaveNoViolations`).

---

## 5. WORKSTREAM B — E2E PLAYWRIGHT

### B1. Setup
**Files**: `apps/web/playwright.config.ts`, `apps/web/e2e/*.spec.ts`
```bash
pnpm --filter web add -D @playwright/test
npx playwright install --with-deps chromium
```
- Config: `baseURL: process.env.WEB_URL ?? 'http://localhost:3000'`, `testDir: './e2e'`, `webServer` tự boot `pnpm dev` (hoặc dùng preview build).
- Dùng account test seed sẵn (qua `prisma/seed.ts` hoặc API register trong `beforeAll`).

### B2. Kịch bản E2E (ít nhất 5)
| # | Kịch bản | File | Verify |
|---|----------|------|--------|
| 1 | **Auth**: register → login → logout → login lại | `e2e/auth.spec.ts` | redirect đúng, token lưu |
| 2 | **Browse**: xem danh sách sản phẩm → filter → mở chi tiết | `e2e/browse.spec.ts` | list render, detail load |
| 3 | **Cart→Checkout**: thêm vào giỏ → checkout → (mock PayOS) → đơn hàng tạo | `e2e/checkout.spec.ts` | order PENDING tạo, redirect |
| 4 | **Download**: dashboard → license → tải → file decrypt + watermark | `e2e/download.spec.ts` | file trả về có WATERMARK.txt |
| 5 | **Admin**: login admin → revoke license → user không tải được | `e2e/admin.spec.ts` | 403 khi download revoked |

### B3. Tích hợp CI
Thêm job `e2e` vào `ci.yml`:
```yaml
e2e:
  runs-on: ubuntu-latest
  services: { postgres: ... }
  steps:
    - pnpm install --frozen-lockfile
    - pnpm --filter api prisma db push
    - pnpm --filter api start &  # hoặc docker-compose
    - pnpm --filter web start &
    - pnpm --filter web exec playwright test
```
- Dùng `docker-compose` (đã có `infrastructure/docker/docker-compose.yml`) để dựng API + Postgres + R2(MinIO) + MeiliSearch nhanh.

---

## 6. WORKSTREAM C — PERF + LIGHTHOUSE CI

### C1. Lighthouse CI
**Files**: `apps/web/lighthouserc.js` (hoặc `.lighthouserc.json`), thêm `@lhci/cli`
```bash
pnpm --filter web add -D @lhci/cli
```
```json
{
  "ci": {
    "collect": { "staticDistDir": ".next", "url": [...] },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.8}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}]
      }
    }
  }
}
```
- URL test: `/`, `/products`, `/products/[slug]`, `/login`, `/blog`.
- Thêm job `lighthouse` vào CI chạy sau `web build`.

### C2. Load Test API (download path)
**Tool**: `k6` (script JS chạy local) hoặc `artillery`.
- Script `scripts/load-test-download.js` (k6):
  - Setup: login lấy token, lấy license id hợp lệ.
  - Vu: 50 RPS trong 1 phút gọi `GET /licenses/:id/download`.
  - Assert: rate < 5% 5xx, p95 < 500ms.
- Chạy local (không cần CI): `k6 run scripts/load-test-download.js`.
- Lưu kết quả vào `docs/phase6-loadtest.md`.

---

## 7. WORKSTREAM D — THỰC THI UAT PHASE 5

### D1. Chuẩn bị môi trường
- Dùng `docker-compose up` (Postgres + MinIO/R2 + MeiliSearch) + seed data.
- Biến môi trường: `.env` với `SOURCE_ENCRYPTION_KEY` (32 byte hex), `R2_*` (MinIO local), `PAYOS_*` (sandbox).

### D2. Thực thi checklist
- Chạy từng kịch bản trong `docs/uat-phase6.md` (Đăng ký/Login, Mua hàng, Download mã hóa, Watermark, License verify/revoke, Rate limit, Audit log).
- Ghi kết quả Pass/Fail vào bảng cuối file (hoặc file mới `docs/uat-phase6-results.md`).
- Mỗi Fail: ghi log/curl output + tạo ticket (issue) để fix.

### D3. Fix & Re-test
- Fix các lỗi tìm thấy (có thể là bug thực sự cần sửa code Phase 5).
- Re-run kịch bản Fail đến khi xanh.

---

## 8. THỨ TỰ THỰC HIỆN (Sequence)

1. **A1+A2**: Web CI + coverage gate (nhanh, nền tảng)
2. **A3+A4**: Bổ sung unit test API + web component
3. **B1+B2+B3**: Playwright E2E + CI job
4. **C1+C2**: Lighthouse CI + load test
5. **D1+D2+D3**: UAT Phase 5 thực thi + fix
6. **Final**: Tổng hợp report, verify DoD, chuyển Phase 7

---

## 9. FILES SẼ THAY ĐỔI / TẠO MỚI

| File | Thay đổi |
|------|----------|
| `.github/workflows/ci.yml` | Thêm web-test, e2e, lighthouse jobs |
| `apps/api/jest.config.js` | Thêm coverage + threshold |
| `apps/web/vitest.config.ts` | Thêm coverage config |
| `apps/api/src/**/*.spec.ts` | Thêm spec (audit, coupons, reviews, custom-projects, tickets, users) |
| `apps/web/src/components/**/*.test.tsx` | Thêm component tests |
| `apps/web/playwright.config.ts`, `apps/web/e2e/*.spec.ts` | MỚI — E2E |
| `apps/web/lighthouserc.json` | MỚI — Lighthouse config |
| `scripts/load-test-download.js` | MỚI — k6 load test |
| `docs/uat-phase6-results.md` | MỚI — UAT results |
| `docs/phase6-loadtest.md` | MỚI — load test report |

---

## 10. VERIFICATION (Cách test end-to-end)

```bash
# 1. API tests + coverage
cd apps/api && npx jest --coverage

# 2. Web tests + coverage
cd apps/web && npx vitest run --coverage

# 3. Web build (CI parity)
cd apps/web && pnpm build

# 4. E2E (cần server chạy)
cd apps/web && npx playwright test

# 5. Lighthouse
cd apps/web && npx lhci autorun

# 6. Load test (cần API + token)
k6 run scripts/load-test-download.js

# 7. UAT
# Dựng docker-compose, mở staging, chạy docs/uat-phase6.md thủ công
```

**Gate cuối**: Push lên `main` → CI phải xanh (build + api test + web test + e2e + lighthouse). UAT results ghi đầy đủ. → Sẵn sàng Phase 7.

---

## 11. RỦI RO & LƯU Ý

| Rủi ro | Mitigation |
|--------|-----------|
| Web build fail trên CI do thiếu env (NEXTAUTH_SECRET...) | Set dummy env trong CI `env:` block |
| E2E flaky (timeout, OAuth) | Dùng account test cục bộ, skip OAuth thực, mock PayOS webhook |
| Lighthouse khó đạt 90 a11y trên trang phức tạp | Ưu tiên fix contrast/label trước, dùng `jest-axe`/vitest-axe sớm |
| Load test cần infra thật | Chạy local với docker-compose, không đưa vào CI (tốn thời gian) |
| UAT bắt bug Phase 5 thật | Dành buffer fix, cập nhật `uat-phase6-results.md` |
