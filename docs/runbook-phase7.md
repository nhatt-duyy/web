# Phase 7 — Runbook Vận Hành (Nhat Duy Market)

> Hướng dẫn xử lý sự cố thường gặp khi đã lên production. Dành cho owner/dev on-call.

---

## 0. Truy cập VPS

```bash
ssh <VPS_USER>@<VPS_HOST>
cd /opt/nhatduy-market
docker compose -f infrastructure/docker/docker-compose.prod.yml ps
docker compose -f infrastructure/docker/docker-compose.prod.yml logs -f <service>
```

---

## 1. Lỗi thường gặp & cách xử lý

### 1.1 Deploy thất bại (SSH/healthcheck fail)
**Triệu chứng**: `deploy.yml` báo đỏ ở job `deploy`, hoặc healthcheck trả lỗi.
**Xử lý**:
1. SSH vào VPS, xem log: `docker compose -f ... logs api`.
2. Nếu lỗi env thiếu → check `.env.production` đầy đủ chưa.
3. Rollback ngay: `./scripts/rollback.sh <tag_cũ>` (xem §3).
4. Sửa code → push lại `main` → deploy mới.

### 1.2 API health trả 500 / không phản hồi
**Xử lý**:
```bash
docker compose -f ... restart api
docker compose -f ... logs api --tail 100
curl -fsS http://localhost:3001/health
```
- Nếu DB không connect → check `postgres` health: `docker compose ps postgres`.
- Nếu thiếu migration → chạy `docker compose exec api pnpm --filter api exec prisma migrate deploy`.

### 1.3 Web 502 Bad Gateway (qua Cloudflare)
**Nguyên nhân**: nginx không kết nối được `web:3000` hoặc web crash.
**Xử lý**:
```bash
docker compose ps web
docker compose logs web --tail 50
docker compose restart web
```
Check Cloudflare: Origin cert còn hạn? SSL mode đúng Full Strict?

### 1.4 Admin không load / trắng trang
**Xử lý**: là SPA tĩnh → check nginx-admin container:
```bash
docker compose logs admin
curl -fsS http://localhost:80/   # từ trong VPS
```
Nếu build sai `VITE_API_URL` → rebuild admin với arg đúng rồi redeploy.

### 1.5 DB Postgres không lên (data corruption)
**Xử lý**:
1. Không xóa volume `pgdata`.
2. Restore từ backup gần nhất:
```bash
# copy file backup vào VPS
gunzip -c backups/backup_YYYYMMDD_HHMM.sql.gz | \
  docker exec -i <postgres_container> psql -U <user> -d <db>
```
3. Nếu cần, chạy `prisma migrate deploy` lại.

### 1.6 Lỗi thanh toán PayOS (webhook fail)
**Xử lý**:
- Check log `api` bộ phận payments.
- PayOS gửi lại webhook tự động (idempotent) → đảm bảo order không double-count.
- Sentry sẽ capture lỗi → xem chi tiết stack trace.

### 1.7 Certificate hết hạn / 526 Error (Cloudflare)
**Xử lý**: Origin cert Cloudflare 5 năm. Nếu hết:
1. Tạo cert mới trên Cloudflare Dashboard → copy `origin.crt/key`.
2. SCP vào VPS `ssl/`, `docker compose restart nginx`.

---

## 2. Rollback (khi deploy lỗi giữa chừng)

Xem `scripts/rollback.sh`. Quy trình chuẩn:
```bash
cd /opt/nhatduy-market
./scripts/rollback.sh --list          # xem tag có sẵn
./scripts/rollback.sh v1.0.0          # rollback toàn bộ
# hoặc chỉ 1 service:
./scripts/rollback.sh api v1.0.0
```
Sau rollback → verify healthcheck 3 endpoint.

---

## 3. Backup thủ công / Restore test

```bash
# Backup ngay
./scripts/backup.sh

# Restore test (vào DB staging, KHÔNG restore thẳng production đang chạy)
gunzip -c backups/backup_YYYYMMDD_HHMM.sql.gz | psql -U staging_user -d staging_db
```

---

## 4. Monitoring & Alert

- **Sentry**: dashboard `nhatduy-market-*`, alert email khi error rate > ngưỡng.
- **UptimeRobot**: 3 monitor, alert khi down > 1 phút.
- **Cloudflare**: Analytics → xem traffic/lỗi WAF.

---

## 5. Escalation & Liên hệ

| Mức | Trường hợp | Người nhận | Hành động |
|-----|-----------|-----------|-----------|
| P1 | Toàn bộ site down (502 liên tục > 10p) | Owner + Dev on-call | Rollback ngay, báo cộng đồng |
| P2 | 1 service lỗi (api/web/admin) | Dev on-call | Restart/rollback service đó |
| P3 | Lỗi nhỏ (1 tính năng) | Dev backlog | Sửa trong sprint tiếp theo |

**Liên hệ khẩn cấp**:
- Owner: `@nhatduy` (Telegram/email)
- VPS provider: Vultr/DigitalOcean support
- Domain/DNS: Cloudflare support

---

## 6. Post-incident

1. Ghi chú nguyên nhân trong `#incident` channel.
2. Tạo ticket sửa root cause.
3. Cập nhật runbook này nếu có bước mới.

---

*Runbook ánh xạ từ plan Phase 7 §7 E2. Cập nhật định kỳ sau mỗi sự cố.*
