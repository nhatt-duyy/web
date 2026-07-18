# Phase 7 — Thiết lập Cloudflare (Domain / DNS / CDN / SSL)

> **Mục đích**: Hướng dẫn thêm domain, cấu hình DNS trỏ về VPS, bật CDN/WAF/TLS của Cloudflare cho Nhat Duy Market.
> **Trạng thái**: CHỈ HƯỚNG DẪN — chưa có account/domain thật trong môi trường dev. User tự thực hiện trên Cloudflare dashboard.

---

## B1. Chuẩn bị

1. Mua domain (ví dụ: `nhatduymarket.com`) tại bất kỳ registrar nào (Namecheap, GoDaddy, Cloudflare Registrar...).
2. Có sẵn VPS chạy production (Vultr/DigitalOcean SG) với IP public tĩnh, đã mở port 80/443.
3. Đã deploy stack `docker-compose.prod.yml` lên VPS (xem `docs/runbook-phase7.md`).

## B2. Add site vào Cloudflare

1. Đăng nhập Cloudflare Dashboard → **Add a Site** → nhập domain.
2. Chọn plan **Free** (đủ cho CDN + WAF + SSL).
3. Cloudflare hiển thị 2 nameserver (VD: `drake.ns.cloudflare.com`). Copy cả 2.
4. Vào registrar của domain → đổi Nameserver thành 2 cái của Cloudflare.
5. Chờ propagate (5 phút – 24h). Trạng thái site chuyển **Active**.

## B3. DNS Records

Tạo các record (bật **Proxy** = icon đám mây **màu vàng/orange**):

| Type  | Name | Content (VPS IP)     | Proxy |
|-------|------|----------------------|-------|
| A     | @    | `<VPS_PUBLIC_IP>`    | 🟠    |
| AAAA  | @    | `<VPS_PUBLIC_IPV6>`  | 🟠    |
| CNAME | www  | `nhatduymarket.com`  | 🟠    |

> Admin để dưới path `/admin` (theo nginx.conf) nên KHÔNG cần subdomain riêng. Nếu muốn `admin.domain.com`, tạo thêm A record `admin → IP` và 1 server block nginx tương ứng.

## B4. SSL / TLS

1. **SSL/TLS > Overview** → mode **Full (Strict)**.
2. **SSL/TLS > Edge Certificates**:
   - Bật **Always Use HTTPS**.
   - Bật **HTTP Strict Transport Security (HSTS)** → max-age 12 tháng, includeSubDomains, preload.
   - Bật **Automatic HTTPS Rewrites**.
   - Bật **Brotli**.
3. **Origin Certificate**: vào **SSL/TLS > Origin Server** → **Create Certificate** → copy `origin.crt` + `origin.key` → lưu lên VPS tại `/opt/nhatduy-market/infrastructure/docker/ssl/` (mount vào nginx container theo `docker-compose.prod.yml`). File này KHÔNG commit.

## B5. Caching & Performance

1. **Caching > Configuration**: set **Caching Level: Standard**.
2. **Cache Rules** (hoặc Page Rules cũ):
   - Rule: `URL matches wildcard *nhatduymarket.com/_next/static/*` → **Cache Everything**, Edge TTL 1 tháng.
   - Rule: `Hostname = nhatduymarket.com AND URI Path starts with /api` → **Bypass Cache** (API không cache).
3. **Speed > Optimization**: bật Auto Minify (HTML/CSS/JS), Polish (image) nếu có ảnh.

## B6. WAF / Security (cơ bản)

1. **Security > Settings**: Security Level = Medium.
2. **Security > WAF** > Managed Rules: bật Cloudflare Managed Ruleset (chặn SQLi/XSS cơ bản).
3. **Network**: bật **HTTP/2**, **HTTP/3**, **0-RTT**.

## B7. Verify

```bash
# Từ local, sau khi DNS propagate
curl -I https://nhatduymarket.com/            # mong đợi 200 + header Strict-Transport-Security
curl -I https://nhatduymarket.com/api/health # mong đợi 200 {"status":"ok"}
curl -I https://nhatduymarket.com/admin/     # mong đợi 200 (SPA index)
```

---

## Rủi ro & lưu ý

| Rủi ro | Xử lý |
|--------|-------|
| DNS propagate chậm | Làm B trước go-live 24–48h |
| Origin cert hết hạn (5 năm) | Cloudflare auto-renew, nhưng lưu ý set reminder |
| Cache API nhầm | Đảm bảo Cache Rule bypass `/api` |
| SSL Full Strict báo 526 | Origin cert chưa đúng / chưa mount → check `ssl/` volume |
