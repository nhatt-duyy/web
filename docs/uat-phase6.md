# UAT CHECKLIST — PHASE 6 (User Acceptance Testing)

> **Dự án**: Website bán Source Code + Dịch vụ Custom Development (SourceBan)
> **Phase**: 6 — Kiểm thử & Tối ưu (UAT track D)
> **Phạm vi**: End-to-end trên môi trường **staging / local dev** cho các tính năng đã hoàn thành ở **Phase 5** (Bảo mật & Chống rò rỉ source code).
> **Ngày soạn**: 2026-07-16
> **Người thực hiện**: QA

---

## 📌 NGỮ CẢNH PHASE 5 (ĐÃ XONG — CẦN UAT)

| Mã | Tính năng | Trạng thái |
|----|-----------|------------|
| M1 | License Key (tạo/verify/activate/revoke) | ✅ Done |
| M2 | Encrypted Download (file `.enc` trên R2 + presigned URL 15 min TTL) | ✅ Done |
| M3 | Watermark (WATERMARK.txt + fingerprint ẩn theo email chủ sở hữu) | ✅ Done |
| M4 | Audit Log (ghi hành động nhạy cảm: login, download, revoke, encrypt) | ✅ Done |
| M5 | Rate Limit (Auth 5/min, License Activate 10/min, Download 20/min, General 100/min) | ✅ Done |

> **Tham chiếu spec**: `docs/api-contract.md`, `docs/security-plan.md`, `docs/erd.md`
> **Lưu ý rate limit thực tế** (theo `api-contract.md` dòng 6): Auth **5/min**, Download **20/min** (không phải 10 như mô tả task — dùng đúng spec). Webhook **KHÔNG** bị throttle.

---

## 🧪 CÁCH SỬ DỤNG CHECKLIST NÀY

- Mỗi kịch bản có: **Mô tả**, **Các bước**, **Kết quả kỳ vọng**, **Cách verify**.
- Chạy trên staging/local dev. Cần: API base URL (`$API`), Web base URL (`$WEB`), Admin base URL (`$ADMIN`), token đăng nhập (`$TOKEN`), admin token (`$ADMIN_TOKEN`).
- Đánh dấu `☐` → `☑` vào cột **Pass/Fail** sau khi chạy.
- Ghi rõ log/curl output vào **Ghi chú** nếu Fail.

---

## KỊCH BẢN 1 — Đăng ký / Đăng nhập (Email-JWT + OAuth)

**Mô tả**: Xác minh luồng auth cơ bản hoạt động cả bằng email/password (JWT) và OAuth Google/GitHub.

**Các bước**:
1. Mở `$WEB/register` → đăng ký tài khoản mới bằng email + mật khẩu.
2. Xác thực email (nhấn link trong mail test / gọi `POST /auth/verify-email`).
3. Đăng nhập `POST /auth/login` → nhận accessToken + refreshToken.
4. Đăng xuất `POST /auth/logout` → refreshToken bị thu hồi.
5. Thử đăng nhập OAuth: truy cập `$WEB/login` → nút "Google" / "GitHub" → callback thành công → tạo session.

**Kết quả kỳ vọng**:
- Đăng ký/thiết lập profile OK; email xác thực gửi đi.
- Login trả `200` + `accessToken` (JWT hợp lệ, decode có `sub`, `exp`).
- Logout thực sự vô hiệu refreshToken (dùng lại refreshToken cũ → `401`).
- OAuth redirect đúng, tạo user (hoặc link vào user đã có), session thiết lập.

**Cách verify**:
```bash
# Login
curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"qa@test.dev","password":"Test@123"}' | jq '.'
# Decode JWT (kiểm tra exp)
echo "$TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null | jq '.'
```
UI: thao tác trên `$WEB/login`, `$WEB/register`; kiểm tra redirect sau OAuth.

**Pass/Fail**: ☐ Pass  ☐ Fail
**Ghi chú**: ________________________________________________

---

## KỊCH BẢN 2 — Duyệt Marketplace → Tìm kiếm MeiliSearch → Xem chi tiết

**Mô tả**: Xác minh luồng khám phá sản phẩm: list → full-text search (MeiliSearch) → trang chi tiết.

**Các bước**:
1. Mở `$WEB` → trang danh sách sản phẩm, filter theo danh mục/công nghệ, sort, phân trang.
2. Gõ từ khóa (VD: "nextjs", "ecommerce") vào ô search → kết quả từ MeiliSearch trả về nhanh (<300ms).
3. Click vào 1 sản phẩm → trang chi tiết hiển thị mô tả, gallery, giá, các license type (Regular/Extended), nút "Mua".

**Kết quả kỳ vọng**:
- Danh sách load được, filter/sort/pagination hoạt động.
- Search MeiliSearch trả đúng kết quả liên quan, có highlighting, phản hồi nhanh.
- Trang chi tiết đầy đủ thông tin, hiển thị đúng `downloadLimit`/`price` theo license type.

**Cách verify**:
```bash
# MeiliSearch query trực tiếp (nếu expose)
curl -s "$API/products?q=nextjs&page=1" | jq '.data[].name'
# Hoặc qua search endpoint
curl -s -X POST "$API/search" -H 'Content-Type: application/json' \
  -d '{"query":"ecommerce","limit":10}' | jq '.'
```
UI: `$WEB/products`, `$WEB/products/[id]`.

**Pass/Fail**: ☐ Pass  ☐ Fail
**Ghi chú**: ________________________________________________

---

## KỊCH BẢN 3 — Giỏ hàng → Thanh toán PayOS sandbox → Webhook → Đơn PAID → Tự động tạo License

**Mô tả**: Luồng mua hàng end-to-end: add cart → tạo order → thanh toán PayOS sandbox → webhook cập nhật PAID → license được sinh tự động.

**Các bước**:
1. Đăng nhập user → thêm 1 sản phẩm + chọn license type vào giỏ → `POST /orders` (tạo order, `paymentMethod: PAYOS`).
2. Nhận `checkoutUrl` → mở PayOS sandbox → thanh toán thành công (hoặc giả lập webhook).
3. PayOS gửi `POST /payments/webhook/payos` (verify `X-Signature` HMAC-SHA256).
4. Order chuyển `PAID`; hệ thống tự động tạo License (gán user, license key, `maxDownloads`).
5. Kiểm tra `GET /licenses` user thấy license mới.

**Kết quả kỳ vọng**:
- Order tạo thành công, `checkoutUrl` hợp lệ.
- Webhook xác thực chữ ký OK (`200`); sai signature → `400 PAYMENT_VERIFICATION_FAILED`.
- Sau webhook: order `status=PAID`, license được tạo tự động (có `key`, `maxDownloads` đúng license type).
- User xem được license trong dashboard.

**Cách verify**:
```bash
# Tạo order
curl -s -X POST "$API/orders" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":"<pid>","licenseTypeId":"<ltid>"}]}' | jq '.'
# Giả lập webhook PayOS (cần signature đúng)
curl -s -X POST "$API/payments/webhook/payos" -H "X-Signature: $SIG" \
  -H 'Content-Type: application/json' -d '{"orderId":"<oid>","status":"PAID"}' | jq '.'
# Xem license
curl -s "$API/licenses" -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Pass/Fail**: ☐ Pass  ☐ Fail
**Ghi chú**: ________________________________________________

---

## KỊCH BẢN 4 — Tải source → Zip chứa WATERMARK.txt đúng email chủ sở hữu

**Mô tả**: Sau khi đơn PAID, user tải file → file zip trả về phải chứa `WATERMARK.txt` ghi email chủ sở hữu đúng.

**Các bước**:
1. User `POST /licenses/:key/download` → nhận `downloadUrl` (presigned R2, TTL 15 phút).
2. Tải file về, giải nén.
3. Mở `WATERMARK.txt` → đối chiếu email trong file == email user.
4. (Nâng cao) kiểm tra fingerprint ẩn (whitespace encoding / comment id) khớp license key.

**Kết quả kỳ vọng**:
- `downloadUrl` trả về, tải thành công file `.zip`.
- Bên trong zip có `WATERMARK.txt` chứa email user chính xác (VD: `qa@test.dev`).
- Fingerprint ẩn nhất quán với license/user (dùng tool `packages/watermark` để decode nếu có).

**Cách verify**:
```bash
curl -s -X POST "$API/licenses/$KEY/download" -H "Authorization: Bearer $TOKEN" | jq -r '.downloadUrl' > /tmp/url.txt
wget -O /tmp/src.zip "$(cat /tmp/url.txt)"
unzip -l /tmp/src.zip | grep WATERMARK.txt
unzip -p /tmp/src.zip WATERMARK.txt
```

**Pass/Fail**: ☐ Pass  ☐ Fail
**Ghi chú**: ________________________________________________

---

## KỊCH BẢN 5 — Xác minh License: `/licenses/verify` valid & BAD_FORMAT

**Mô tả**: Endpoint verify license key trả `valid` với key đúng định dạng/hợp lệ, và `BAD_FORMAT` với key sai định dạng.

**Các bước**:
1. `POST /licenses/verify` với body chứa license key hợp lệ (đúng format, chưa revoked, còn hạn).
2. `POST /licenses/verify` với key sai định dạng (VD: rỗng / ký tự lạ / thiếu phần).
3. (Tùy chọn) verify key đã revoked → expect `INVALID`/`REVOKED`.

**Kết quả kỳ vọng**:
- Key hợp lệ → `200` + `{ "valid": true, "license": {...} }`.
- Key sai định dạng → `400` + mã lỗi `BAD_FORMAT` (theo `api-contract.md` error table).
- Key revoked → `valid: false` / `REVOKED`.

**Cách verify**:
```bash
curl -s -X POST "$API/licenses/verify" -H 'Content-Type: application/json' \
  -d '{"key":"<VALID_KEY>"}' | jq '.'
curl -s -X POST "$API/licenses/verify" -H 'Content-Type: application/json' \
  -d '{"key":"@@@bad@@@"}' | jq '.'
```

**Pass/Fail**: ☐ Pass  ☐ Fail
**Ghi chú**: ________________________________________________

---

## KỊCH BẢN 6 — Admin thu hồi (revoke) License → User tải bị 403

**Mô tả**: Admin revoke license → user không thể tải file (403 Forbidden) và license không còn valid.

**Các bước**:
1. Admin `POST /admin/licenses/:key/revoke` (dùng `$ADMIN_TOKEN`).
2. User thử `POST /licenses/:key/download` → expect `403`.
3. User thử verify key → expect `valid: false` / `REVOKED`.

**Kết quả kỳ vọng**:
- Revoke thành công (`200`, license `status=REVOKED`).
- User download → `403 Forbidden` (không trả `downloadUrl`).
- Verify key revoked → `valid: false`.

**Cách verify**:
```bash
curl -s -X POST "$API/admin/licenses/$KEY/revoke" -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API/licenses/$KEY/download" -H "Authorization: Bearer $TOKEN"
# expect 403
```

**Pass/Fail**: ☐ Pass  ☐ Fail
**Ghi chú**: ________________________________________________

---

## KỊCH BẢN 7 — Rate Limit (Auth / Download / Webhook)

**Mô tả**: Xác minh giới hạn tần suất: login sai 5 lần/phút → 429; download >20 lần/phút → 429; webhook KHÔNG bị throttle.

**Các bước**:
1. Gửi `POST /auth/login` sai password **6 lần liên tiếp trong 1 phút** → request thứ 6 trở đi → `429`.
2. Gửi `POST /licenses/:key/download` **21 lần trong 1 phút** (với key hợp lệ) → request thứ 21 → `429`.
3. Gửi `POST /payments/webhook/payos` **liên tục 30 lần** → tất cả đều xử lý (không `429`).

**Kết quả kỳ vọng**:
- Auth: request vượt 5/min → `429` (header `Retry-After` có mặt).
- Download: vượt 20/min → `429`.
- Webhook: không bị rate limit (`200`/`400` do signature, KHÔNG `429`).

**Cách verify**:
```bash
# Auth brute (sai pass)
for i in $(seq 1 6); do
  curl -s -o /dev/null -w "req$i: %{http_code}\n" -X POST "$API/auth/login" \
    -H 'Content-Type: application/json' -d '{"email":"qa@test.dev","password":"wrong"}'
done
# Download burst
for i in $(seq 1 21); do
  curl -s -o /dev/null -w "dl$i: %{http_code}\n" -X POST "$API/licenses/$KEY/download" -H "Authorization: Bearer $TOKEN"
done
# Webhook burst (không 429)
for i in $(seq 1 30); do
  curl -s -o /dev/null -w "wh$i: %{http_code}\n" -X POST "$API/payments/webhook/payos" -H "X-Signature: $SIG" -d '{}'
done
```

**Pass/Fail**: ☐ Pass  ☐ Fail
**Ghi chú**: ________________________________________________

---

## KỊCH BẢN 8 — Audit Log ghi đủ hành động nhạy cảm

**Mô tả**: Hệ thống ghi audit log cho các hành động: login, download, revoke, encrypt. Có thể truy vấn qua admin.

**Các bước**:
1. Thực hiện: login, download license, admin revoke, (hệ thống encrypt khi build zip).
2. Admin `GET /admin/system/audit` (có filter) → kiểm tra có các entry: `LOGIN`, `DOWNLOAD` (hoặc `LICENSE_DOWNLOAD`), `LICENSE_REVOKE`, `ENCRYPT` (hoặc `FILE_ENCRYPT`).
3. Kiểm tra entry chứa: actorId, action, target, timestamp, ip.

**Kết quả kỳ vọng**:
- Mỗi hành động nhạy cảm sinh đúng 1 audit entry.
- Log immutable (không sửa/xóa qua API user).
- Có thể filter theo action/user trên `/admin/system/audit`.

**Cách verify**:
```bash
curl -s "$API/admin/system/audit?action=LOGIN" -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
curl -s "$API/admin/system/audit?action=LICENSE_REVOKE" -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
```

**Pass/Fail**: ☐ Pass  ☐ Fail
**Ghi chú**: ________________________________________________

---

## KỊCH BẢN 9 — Bảo mật file source trên R2 (mã hóa + presigned + không lộ file gốc)

**Mô tả**: File gốc trên R2 phải ở dạng `.enc` (đã mã hóa at rest), chỉ tải được qua presigned URL (15 min TTL), không truy cập được file gốc công khai.

**Các bước**:
1. Kiểm tra object key trên R2 có đuôi `.enc` (VD: `products/{pid}/v1/{uuid}.zip.enc`).
2. Thử truy cập URL công khai không có signature → expect `403`/`AccessDenied`.
3. Dùng presigned URL tải về → giải mã trong API trước khi trả user (user nhận zip thường, không nhận `.enc`).
4. Presigned URL hết hạn (đợi >15 min hoặc set TTL test) → expect `403 Expired`.
5. Kiểm tra URL không lộ thông tin nhạy cảm trong path/query ngoài Signature/Expires/KeyId.

**Kết quả kỳ vọng**:
- Object R2 lưu dạng `.enc` (mã hóa at rest).
- Không tải được file gốc không qua presigned.
- Presigned URL hết hạn → `403`.
- User tải về nhận được zip đã giải mã (chứa WATERMARK.txt), không phải `.enc` thô.

**Cách verify**:
```bash
# Thử URL gốc không signature (expect 403)
curl -s -o /dev/null -w "%{http_code}\n" "https://r2.sourceban.dev/products/<pid>/v1/<uuid>.zip.enc"
# Presigned hết hạn
curl -s -o /dev/null -w "%{http_code}\n" "$EXPIRED_URL"  # expect 403
# File user tải có đuôi .zip (không .enc)
file /tmp/src.zip
```

**Pass/Fail**: ☐ Pass  ☐ Fail
**Ghi chú**: ________________________________________________

---

## 📊 TỔNG KẾT UAT

| # | Kịch bản | Pass | Fail | Ghi chú |
|---|----------|------|------|---------|
| 1 | Đăng ký / Đăng nhập | ☐ | ☐ | |
| 2 | Marketplace → Search → Chi tiết | ☐ | ☐ | |
| 3 | Cart → PayOS → Webhook → License | ☐ | ☐ | |
| 4 | Tải source có WATERMARK.txt | ☐ | ☐ | |
| 5 | Verify license valid / BAD_FORMAT | ☐ | ☐ | |
| 6 | Admin revoke → User 403 | ☐ | ☐ | |
| 7 | Rate limit (Auth/Download/Webhook) | ☐ | ☐ | |
| 8 | Audit log đủ hành động | ☐ | ☐ | |
| 9 | Bảo mật file R2 (.enc/presigned) | ☐ | ☐ | |

**Kết luận**: ☐ Đạt UAT (sẵn sàng Phase 7)  ☐ Cần fix trước launch (liệt kê bug bên dưới)

**Danh sách bug (nếu có)**:
- 

**Người UAT**: __________  **Ngày**: __________  **Môi trường**: staging/local dev
