# Phase 7 — Launch Checklist (Go-Live)

> Tick từng ô trước khi go-live chính thức. Mọi mục phải ✅ mới được công bố.

---

## 1. Pre-flight (code & CI)

- [ ] **CI xanh trên `main`** — `ci.yml` chạy qua: lint, build, test (api), web-test, e2e, lighthouse.
- [ ] **Deploy workflow** `.github/workflows/deploy.yml` đã có, build 3 image → GHCR → SSH VPS.
- [ ] **Branch `main`** sạch, không có WIP.
- [ ] **Tag version** chuẩn bị (vd `v1.0.0`) nếu release theo tag.

## 2. Infrastructure

- [ ] **VPS** đã thuê (Vultr/DigitalOcean SG), OS Ubuntu 24.04, Docker + compose plugin cài xong.
- [ ] **docker-compose.prod.yml** chạy được: `nginx`, `web`, `admin`, `api`, `postgres`, `meilisearch`.
- [ ] **Dockerfile** 3 app: multi-stage, non-root, HEALTHCHECK ok.
- [ ] **`.env.production`** đã tạo trên VPS (từ `.env.production.example`), secret mạnh, KHÔNG commit.
- [ ] **Cloudflare Origin Cert** đã lưu tại `infrastructure/docker/ssl/` trên VPS.

## 3. Domain / DNS / CDN

- [ ] **Domain** đã mua, nameserver trỏ Cloudflare.
- [ ] **DNS A/AAAA** → VPS IP, bật orange-cloud proxy.
- [ ] **SSL Full Strict** + HSTS + Brotli bật trên Cloudflare.
- [ ] **Cache Rules**: bypass `/api`, cache `/_next/static`.
- [ ] **Verify**: `curl -I https://domain.com/` trả 200 + HSTS header.

## 4. Monitoring

- [ ] **Sentry**: 3 project tạo, DSN điền vào env VPS.
- [ ] **Sentry alerts**: email/Slack khi error rate cao.
- [ ] **UptimeRobot**: 3 monitor (`/`, `/api/health`, `/admin/`) mỗi 5 phút.
- [ ] **Verify Sentry**:故意 trigger 1 lỗi test → thấy trong dashboard.

## 5. Backup & Rollback

- [ ] **`scripts/backup.sh`** chạy thử thành công → sinh file `backup_YYYYMMDD_HHMM.sql.gz`.
- [ ] **Cron** đã đặt (vd 0 2 * * *) chạy backup.
- [ ] **Restore test**: `gunzip + psql` vào DB staging thành công.
- [ ] **`scripts/rollback.sh --list`** liệt kê được tag.
- [ ] **Rollback test**: `rollback.sh <tag_cũ>` chạy xanh trên staging.

## 6. Security

- [ ] **Secrets** không hardcode (qua env / GitHub Secrets).
- [ ] **Firewall**: chỉ mở 22/80/443; 3000/3001/5432/7700 chỉ nội bộ.
- [ ] **NEXTAUTH_SECRET / JWT_SECRET / SOURCE_ENCRYPTION_KEY** là random 32-byte.
- [ ] **Cloudflare WAF** Managed Ruleset bật.

## 7. Smoke test trên Production

- [ ] **Browse**: vào trang chủ, xem danh sách source code.
- [ ] **Buy**: thêm vào giỏ, thanh toán PayOS (sandbox hoặc live).
- [ ] **Download**: sau thanh toán thành công → tải file từ R2.
- [ ] **Admin**: `/admin/` đăng nhập, xem dashboard KPI.
- [ ] **Auth**: đăng ký/đăng nhập Google/GitHub hoạt động.

## 8. Go-Live

- [ ] **Deploy chính thức**: push `main` (hoặc tag) → `deploy.yml` chạy xanh.
- [ ] **Verify production** sau deploy: 3 healthcheck ok.
- [ ] **Thông báo launch**: đăng social, cộng đồng dev (theo plan Phase 8 sẽ có affiliate/SEO).
- [ ] **Runbook** `docs/runbook-phase7.md` đã đọc, sẵn sàng xử lý sự cố.

---

## 9. Local test (không có domain — đã test 2026-07-18)

> Chưa có domain thật → test Phase 7 infra trên localhost (WSL Ubuntu). Docker WSL integration **chưa bật** nên chưa chạy được docker-compose.prod (chỉ test syntax + logic).

- [x] **Health endpoint**: `GET /health` (NestJS, KHÔNG prefix `/api`) trả `{"status":"ok","timestamp"}` → 200. ✅
- [x] **Full stack local**: web :3000 (200) + api :3001 (200) + admin :3002 (200) đều sống.
- [x] **Web→API proxy**: `web /api/products` → trả data thật ("Booking System") qua Next.js proxy. ✅
- [x] **Bug fix**: deploy.yml / docker-compose.prod / Dockerfile.api dùng `localhost:3001/api/health` (sai) → sửa thành `localhost:3001/health` (internal). URL public qua nginx/cloudflare vẫn đúng là `/api/health` (nginx strip prefix). ✅
- [x] **Scripts valid**: `backup.sh`, `rollback.sh` qua `bash -n`; `deploy.yml` + `docker-compose.prod.yml` valid YAML. ✅
- [ ] **Docker stack**: cần bật Docker WSL integration (Docker Desktop → Settings → Resources → WSL Integration → tick Ubuntu) rồi test `docker compose -f infrastructure/docker/docker-compose.prod.yml up` thực tế.
- [ ] **Rollback thực tế**: cần Docker + image đã build/push mới test `rollback.sh <tag>` thật (hiện chỉ verify syntax).
- [ ] **Backup thực tế**: `backup.sh` cần `pg_dump` + cron trên VPS (local chưa chạy vì chưa deploy prod).

---

## Definition of Done (Phase 7)

> [ ] Tất cả ô trên ✅ → Go-live thành công, hệ thống ổn định 24h đầu.

---

*Checklist này ánh xạ trực tiếp từ plan Phase 7 §7 E1.*
