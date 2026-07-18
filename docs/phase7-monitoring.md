# Phase 7 — Monitoring & Alerting (Sentry + UptimeRobot)

> Hướng dẫn thiết lập giám sát lỗi (Sentry) và uptime (UptimeRobot) cho Nhat Duy Market.

---

## C1. Sentry (Error + Performance tracking)

### C1.1 Tạo project & lấy DSN

1. Đăng nhập [sentry.io](https://sentry.io) → **Create Project**.
2. Tạo 3 project (hoặc 1 project có 3 environment):
   - `nhatduy-market-api` (Node/NestJS)
   - `nhatduy-market-web` (Next.js)
   - `nhatduy-market-admin` (React)
3. Copy **DSN** của mỗi project (dạng `https://<key>@<region>.ingest.sentry.io/<project_id>`).

### C1.2 Wire DSN vào app (đã code sẵn)

| App | Biến env | Cách set |
|-----|----------|----------|
| api | `SENTRY_DSN` | trong `.env.production` trên VPS |
| web | `NEXT_PUBLIC_SENTRY_DSN` | build-time arg + runtime env |
| admin | `VITE_SENTRY_DSN` | build-time arg Docker |

> **KHÔNG hardcode DSN** — tất cả qua env/secret. Nếu thiếu DSN, code tự no-op (không init Sentry).

### C1.3 Code đã thêm

- `apps/api/src/main.ts` — `Sentry.init` guarded by `if (process.env.SENTRY_DSN)`, capture bootstrap error.
- `apps/web/src/instrumentation.ts` + `sentry.{server,edge,client}.config.ts` — Next.js instrumentation hook.
- `apps/admin/src/sentry.ts` + `main.tsx` — `initSentry()` no-op nếu thiếu DSN.

### C1.4 Alerting

- Vào Sentry project → **Alerts** → **Create Alert**:
  - Issue: "An issue is first seen" → email owner.
  - Metric: "Error count > 50 trong 5 phút" → Slack/email.
- Set **Environment** = `production` để không nhiễu từ staging.

---

## C2. UptimeRobot (Uptime monitoring)

1. Đăng nhập [uptimerobot.com](https://uptimerobot.com) → **Add New Monitor**.
2. Tạo 3 HTTP monitor (mỗi 5 phút):

| Tên | URL | Kỳ vọng |
|-----|-----|---------|
| Web | `https://your-domain.com/` | 200 |
| API health | `https://your-domain.com/api/health` | 200 `{"status":"ok"}` |
| Admin | `https://your-domain.com/admin/` | 200 |

3. **Alert Contacts**: thêm email + Slack/Telegram.
4. Khi down > 1 phút → nhận alert tự động.

> Lưu ý: UptimeRobot check từ ngoài Internet → cần domain + SSL đã active (xem `docs/phase7-cloudflare-setup.md`).

---

## C3. (Tùy chọn Phase 8) Prometheus/Grafana

Theo plan gốc là "tuỳ chọn sau". Để Phase 8 nếu cần metric chi tiết (CPU/RAM/QPS). Hiện tại Sentry + UptimeRobot đủ cho go-live.

---

## Verify local (staging)

```bash
# API health trả ok
curl http://localhost:3001/health
# → {"status":"ok",...}

# Web build với Sentry (set DSN tạm để test)
NEXT_PUBLIC_SENTRY_DSN=https://fake@sentry.io/1 pnpm --filter web build
```
