# KẾ HOẠCH PHASE 7 — RA MẮT (PRODUCTION LAUNCH)

> **Dự án**: Nhat Duy Market (marketplace source code + custom dev)
> **Phase**: 7 — Go-live chính thức
> **Ngày soạn**: 2026-07-18
> **Tiền đề**: Phase 0→6 đã xong (MVP → QA/UAT). Frontend vừa redesign chống AI-slop (commit `ce80b40`, đã push `origin` + `local`).
> **Quy tắc**: Tuân thủ CLAUDE.md — tiếng Việt, chạy tuần tự phase, không bỏ qua bước.

---

## 0. THỰC TRẠNG ĐẦU VÀO (đã verify 2026-07-18)

| Hạng mục | Trạng thái |
|----------|-----------|
| CI (`ci.yml`) | ✅ Có — build + api test + web test + e2e + lighthouse jobs |
| E2E Playwright | ✅ Có `playwright.config.ts` + `e2e/*.spec.ts` |
| Lighthouse | ✅ Có `lighthouserc.json` |
| Load test | ✅ Có `scripts/load-test-download.js` |
| UAT results | ✅ Có `docs/uat-phase6-results.md` |
| Docker dev stack | ✅ Có `infrastructure/docker/docker-compose.yml` (Postgres + MinIO/R2 + MeiliSearch) |
| **Deploy workflow** | ❌ CHƯA CÓ — chưa có job deploy CI, chưa có script deploy VPS |
| **Domain/DNS/CDN** | ❓ CHƯA XÁC NHẬN (theo stack: Cloudflare CDN + Vultr/DigitalOcean SG) |
| **Monitor/Sentry/UptimeRobot** | ❓ Chưa tích hợp vào deploy |
| **Backup/rollback** | ❌ CHƯA CÓ kịch bản |

→ **Khoảng trống Phase 7**: Deploy pipeline, môi trường production (env thật), domain/DNS, monitor, backup, rollback, launch checklist.

---

## 1. MỤC TIÊU PHASE 7

Đưa Nhat Duy Market **lên production thực tế**, phục vụ người dùng thật, với:
- Quy trình deploy **tự động + an toàn** (CI → build → deploy VPS).
- Giám sát lỗi + uptime **real-time**.
- Kịch bản **backup + rollback** khi sự cố.
- **Launch checklist** đóng gói mọi thứ trước go-live.

---

## 2. DEFINITION OF DONE (Phase 7)

- [ ] Deploy workflow chạy xanh trên push/main: build 3 apps (web, admin, api) → deploy VPS.
- [ ] 3 app chạy trên production (domain thật qua Cloudflare CDN): web + admin + api.
- [ ] Env production được quản lý an toàn (không hardcode secret; dùng `.env` VPS hoặc secret manager).
- [ ] Sentry bắt lỗi + UptimeRobot báo uptime (có dashboard/alert).
- [ ] Backup DB (Postgres) + R2 định kỳ; kịch bản restore đã test.
- [ ] Rollback script (quay về image/version trước) đã test.
- [ ] SSL/HTTPS + HSTS + security headers cơ bản (Cloudflare).
- [ ] Launch checklist (docs/launch-phase7.md) tick đủ, go-live thành công.
- [ ] Viết docs vận hành (runbook) cho owner.

---

## 3. WORKSTREAM A — DEPLOY PIPELINE (CI/CD)

### A1. GitHub Actions deploy workflow
**File MỚI**: `.github/workflows/deploy.yml`
- Trigger: push `main` (hoặc tag `v*`).
- Jobs:
  1. `build`: reuse `ci.yml` (lint+build+test+e2e+lighthouse) → chỉ deploy nếu CI xanh.
  2. `deploy-api`: build Docker image NestJS → push registry (GHCR hoặc Docker Hub) → SSH VPS `docker compose pull && up -d api`.
  3. `deploy-web`: `next build` → rsync/dist lên VPS hoặc build image → deploy.
  4. `deploy-admin`: `vite build` → tĩnh → deploy (có thể cùng VPS qua nginx).
- Dùng secret: `VPS_HOST`, `VPS_USER`, `SSH_KEY`, `DEPLOY_TOKEN`.

### A2. Dockerfile + compose production
**Files**: `infrastructure/docker/Dockerfile.api`, `Dockerfile.web`, `Dockerfile.admin` (nếu chưa có), `docker-compose.prod.yml`.
- Multi-stage build, non-root user, healthcheck.
- Nginx reverse proxy: route `/` → web, `/admin` → admin (static), `/api` → api.

### A3. Env production
- Tạo `.env.production` trên VPS (Postgres thật, R2 thật, PayOS live/sandbox, `NEXTAUTH_SECRET`, `SOURCE_ENCRYPTION_KEY` 32-byte).
- CI không chứa secret — dùng GitHub Secrets + `scp` file env khi deploy.

---

## 4. WORKSTREAM B — DOMAIN / DNS / CDN / SSL

### B1. Cloudflare
- Add domain, point DNS → VPS IP (A/AAAA record).
- Bật **Proxy** (orange cloud) cho CDN + WAF + TLS.
- SSL mode: Full (Strict), bật HSTS, minify, Brotli.
- Page Rules / Cache rules cho static asset (R2, `/_next/static`).

### B2. Subdomain
- `domain.com` → web
- `admin.domain.com` (hoặc `domain.com/admin`) → admin
- `api.domain.com` → api (hoặc `domain.com/api`)

---

## 5. WORKSTREAM C — MONITORING & ALERTING

### C1. Sentry
- Tích hợp vào api (`@sentry/nestjs`) + web (`@sentry/nextjs`) + admin.
- Capture exception + performance, alert qua email/Slack khi error rate cao.

### C2. UptimeRobot
- Monitor 3 endpoint (`/`, `/api/health`, admin) mỗi 5 phút, alert khi down.

### C3. (Tùy chọn) Prometheus/Grafana
- Theo stack gốc là "tuỳ chọn sau" → để Phase 8 nếu cần.

---

## 6. WORKSTREAM D — BACKUP & ROLLBACK

### D1. Backup
- **Postgres**: `pg_dump` hàng ngày → lưu R2 / volume riêng; giữ 7 ngày.
- **R2 source files**: replicate/snapshot định kỳ.
- Script: `scripts/backup.sh` (chạy cron trên VPS).

### D2. Rollback
- Deploy theo version tag → rollback = `docker compose up -d` bản image cũ.
- Script: `scripts/rollback.sh <version>`.
- Test rollback trên staging trước khi go-live.

---

## 7. WORKSTREAM E — LAUNCH CHECKLIST & RUNBOOK

### E1. Launch checklist
**File MỚI**: `docs/launch-phase7.md`
- [ ] CI xanh trên main
- [ ] Deploy staging test ✓
- [ ] Env production đầy đủ
- [ ] Domain + SSL + CDN active
- [ ] Sentry + UptimeRobot live
- [ ] Backup chạy thử thành công
- [ ] Rollback test thành công
- [ ] Smoke test end-to-end trên production (browse→buy→download)
- [ ] Thông báo launch (social, cộng đồng dev)

### E2. Runbook
**File MỚI**: `docs/runbook-phase7.md` — cách xử lý lỗi thường gặp, liên hệ, escalation.

---

## 8. THỨ TỰ THỰC HIỆN

1. **A1+A2+A3**: Deploy pipeline + Docker prod + env.
2. **B1+B2**: Domain/DNS/CDN/SSL.
3. **C1+C2**: Sentry + UptimeRobot.
4. **D1+D2**: Backup + rollback + test.
5. **E1+E2**: Launch checklist + runbook.
6. **GO-LIVE**: deploy main → verify production.

---

## 9. FILES SẼ THAY ĐỔI / TẠO MỚI

| File | Thay đổi |
|------|----------|
| `.github/workflows/deploy.yml` | MỚI — deploy pipeline |
| `infrastructure/docker/Dockerfile.*` | MỚI/SỬA — prod build |
| `infrastructure/docker/docker-compose.prod.yml` | MỚI — prod stack |
| `scripts/backup.sh`, `scripts/rollback.sh` | MỚI |
| `docs/launch-phase7.md` | MỚI — checklist |
| `docs/runbook-phase7.md` | MỚI — vận hành |
| `apps/api/src/*`, `apps/web/*`, `apps/admin/*` | Thêm Sentry init |

---

## 10. RỦI RO & LƯU Ý

| Rủi ro | Mitigation |
|--------|-----------|
| Secret lộ khi deploy | Dùng GitHub Secrets + scp env, không commit `.env` |
| Deploy lỗi giữa chừng | Healthcheck + rollback script test trước |
| Domain/DNS propagate chậm | Làm B trước go-live 24-48h |
| Cost VPS vượt ngân sách | Chọn gói Vultr/DigitalOcean nhỏ, scale sau |
| Data thật mất | Backup test restore trước launch |

---

## 11. PHASE 8 (TĂNG TRƯỞNG) — TÓM TẮT

Sau Phase 7 thành công:
- **SEO**: schema.org, sitemap, rich results, blog đều đặn.
- **Affiliate**: hệ thống chia sẻ hoa hồng cho người bán/reviewer.
- **Multi-lang**: i18n (VI/EN) mở rộng thị trường.
- **Seller marketplace**: mở đăng bán cho seller ngoài (hiện chủ yếu nội bộ).
- **Scale**: Prometheus/Grafana, auto-scaling, CDN mở rộng APAC.

→ Chi tiết Phase 8 sẽ viết plan riêng khi Phase 7 Done.

---

*Plan này bám sát thực trạng đã verify (Phase 6 đã có CI/E2E/Lighthouse/UAT, thiếu deploy/domain/monitor/backup). Frontend redesign (commit ce80b40) đã sẵn sàng đưa lên production trong Phase 7.*
