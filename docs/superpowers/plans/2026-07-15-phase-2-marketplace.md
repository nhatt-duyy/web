# Phase 2 — Marketplace Nâng Cao — Kế Hoạch Triển Khai (chi tiết từng task)

> **Mục tiêu (theo `docs/ke-hoach-chi-tiet-theo-phase.md` §2):** Trải nghiệm mua hàng đạt chuẩn SaaS — search đa tiêu chí, review, đa license, coupon, dashboard khách hàng.
> **Tiền đề Phase 1:** Đã implement đủ theo `docs/superpowers/plans/2026-07-15-phase-1-mvp-core.md` (auth NextAuth+JWT, products CRUD, cart, checkout PayOS, orders, webhook, Resend, admin CRUD+R2 upload, stats, seed 12 SP, CI/Docker).
> **Quyết định chốt:** Search = **MeiliSearch**; **Multi-license đầy đủ** (`LicenseTier`); **Reviews cho mọi user đăng nhập**.
> **Stack:** NestJS 11 + Prisma + Postgres (api:3001), Next.js 15 App Router (web:3000), React 19 + Vite (admin:3002), pnpm. `next.config.ts` có rewrite `/api/*` → NestJS; `middleware.ts` bảo vệ `/dashboard` & `/admin`.
> **Quy ước:** file `YYYY-MM-DD-phase-N-<tên>.md` trong `docs/superpowers/plans/`.

---

## QUY ƯỚC VERIFY (áp dụng mọi task)

Mỗi task có mục **Verify** gồm 4 mức:
- **[CHẠY]** — build/typecheck/test chạy qua, không lỗi biên dịch.
- **[ỔN]** — chạy đúng logic, xử lý được edge case (lỗi, null, quyền), đúng guard.
- **[TỐT]** — code dễ đọc, đúng convention repo (tiếng Việt, camelCase, tái dùng util), có error message rõ.
- **[TỐI ƯU]** — không N+1 query, index DB đúng, không leak, payload nhỏ, debounce search, DTO validate đầu vào.

**Lệnh verify chung:**
```bash
pnpm --filter api typecheck && pnpm --filter api build
pnpm --filter web typecheck && pnpm --filter web build
pnpm --filter admin typecheck && pnpm --filter admin build
# Chạy dev: pnpm --filter api dev (3001), pnpm --filter web dev (3000), pnpm --filter admin dev (3002)
# MeiliSearch: docker compose up -d meilisearch
```

---

## 1. SCHEMA + MIGRATION + SEED (nền tảng)

### Task 1.1 — Cập nhật `schema.prisma` (migration mới)
**Làm gì:**
- Thêm model `Review` (có trường `status ReviewStatus @default(PENDING)` + enum `ReviewStatus{ PENDING APPROVED }` — review chờ admin duyệt), `LicenseTier`, `Coupon` (enum `CouponType{ PERCENT FIXED }`), `Ticket` (enum `TicketStatus{ OPEN REPLIED CLOSED }`).
- Model `Product` thêm: `images String[] @default([])`, `docs Json?`, `changelog Json?`, `demoUrl String?`, `language String?`.
- `OrderItem` thêm `licenseTierId String?`, `tierName String?`.
- `Order` thêm `couponCode String?`.
- `License`: đổi `orderId @unique` → thêm `orderItemId String @unique`, `licenseTierId String?`, `downloadLimit Int @default(5)`, `downloadResetAt DateTime @default(now())` (mốc reset định kỳ 1 tháng). Giữ `downloadCount Int @default(0)` (đã có Phase 1) + quan hệ `order`.
- File: `apps/api/prisma/schema.prisma`.

**Verify:**
- [CHẠY] `pnpm --filter api prisma generate` thành công, không lỗi type.
- [ỔN] Các `@@unique`, `@@index`, `onDelete: Cascade` đúng (review/product/tier xóa cascade; ticket giữ user).
- [TỐT] Comment tiếng Việt giải thích từng trường mới.
- [TỐI ƯU] Index trên `Review.productId`, `LicenseTier.productId`, `Coupon.code` (unique) đã có.

### Task 1.2 — Tạo & chạy migration
**Làm gì:**
- `cd apps/api && pnpm prisma migrate dev --name phase2_marketplace`.
- Với `License.orderId→orderItemId`: migration tự sinh sẽ drop unique cũ + add mới. Viết thêm SQL backfill trong migration:
  ```sql
  UPDATE "License" l SET "orderItemId" = oi.id
  FROM "OrderItem" oi WHERE oi."orderId" = l."orderId";
  ```
- File: `apps/api/prisma/migrations/.../migration.sql` (chỉnh thủ công).

**Verify:**
- [CHẠY] `migrate dev` xong, `migrate status` báo synced.
- [ỔN] Data `License` cũ được backfill `orderItemId` (kiểm tra `SELECT count(*) FROM "License" WHERE "orderItemId" IS NULL` = 0).
- [TỐT] SQL backfill có comment giải thích.
- [TỐI ƯU] Không lock bảng lâu (data nhỏ, ok).

### Task 1.3 — Cập nhật `seed.ts`
**Làm gì:**
- Với 12 sản phẩm có sẵn: tạo 2–3 `LicenseTier`/SP (Regular/Extended, giá khác nhau, `features[]`).
- Tạo 3–5 `Review` mẫu (rating 4–5, comment, `status: APPROVED`) cho vài SP — để hiện ngay trên demo (vì review mặc định PENDING chờ duyệt).
- Tạo 2 `Coupon`: `WELCOME10` (PERCENT 10, maxDiscount 200000), `SALE50K` (FIXED 50000, minOrder 300000).
- File: `apps/api/prisma/seed.ts`.
- Chạy `pnpm prisma db seed`.

**Verify:**
- [CHẠY] Seed chạy không lỗi, `prisma studio` thấy tier/review/coupon.
- [ỔN] Unique `productId+slug` (tier) và `productId+userId` (review) không trùng khi seed lại (dùng upsert hoặc skip nếu tồn tại).
- [TỐT] Dữ liệu demo tiếng Việt, hợp lý.
- [TỐI ƯU] Seed dùng `createMany`/transaction thay vì loop từng query.

---

## 2. SEARCH — MEILISEARCH (làm trước)

### Task 2.1 — Cài đặt client & provider
**Làm gì:**
- `cd apps/api && pnpm add meilisearch`.
- Tạo `apps/api/src/search/meili.provider.ts`: singleton client từ `MEILI_HOST` + `MEILI_MASTER_KEY`, export `MEILI_CLIENT` + `PRODUCT_INDEX = 'products'`.
- Tạo `search.module.ts` (global, import ConfigModule).

**Verify:**
- [CHẠY] `pnpm --filter api build` qua.
- [ỔN] Khi thiếu env Meili → app vẫn khởi động (provider lazy, không crash boot).
- [TỐT] Code tiếng Việt, tách hằng số index name.
- [TỐI ƯU] 1 client duy nhất (singleton), không mở connection mỗi request.

### Task 2.2 — `SearchService` (index/sync/query)
**Làm gì:**
- `apps/api/src/search/search.service.ts`:
  - `ensureIndex()`: tạo index + `updateSettings({ searchableAttributes:['title','description','categoryName'], filterableAttributes:['categoryId','price','isPublished','language'], sortableAttributes:['price','createdAt'] })`.
  - `upsert(product)`: map → `{ id, title, description, price, thumbnail, slug, categoryId, categoryName, isPublished, language, createdAt }`.
  - `remove(id)`, `search({q, category, minPrice, maxPrice, language, sort, page, limit})` → trả `{ hits, estimatedTotalHits, page, limit }`.
- `search.controller.ts`: `GET /search` (công khai), `POST /search/reindex` (ADMIN).

**Verify:**
- [CHẠY] `GET /api/search?q=web` trả JSON hợp lệ.
- [ỔN] Filter `isPublished:true` mặc định; không trả SP nháp. `minPrice/maxPrice/language` lọc đúng.
- [TỐT] DTO validate query (page/limit number, sort hợp lệ).
- [TỐI ƯU] `filterableAttributes` đã khai báo → filter không quét toàn bộ; phân trang Meili đúng (`limit`+`offset`).

### Task 2.3 — Hook đồng bộ từ ProductsService
**Làm gì:**
- Trong `products.service.ts` `create/update/remove`: gọi `SearchService.upsert/remove` (fire-and-forget hoặc `await` trong transaction-like). Khi update category → truyền `categoryName` snapshot.
- File: `apps/api/src/products/products.service.ts`.

**Verify:**
- [CHẠY] Tạo SP mới → `GET /api/search?q=<tên>` thấy SP đó.
- [ỔN] Xóa SP → không còn trong kết quả search.
- [TỐT] Inject `SearchService` đúng DI, không circular dependency (SearchModule global, không import ProductModule).
- [TỐI ƯU] Sync không block response chính (có thể `await` nhưng nhanh; nếu lỗi Meili không làm sập create).

### Task 2.4 — Web: thanh search + filter
**Làm gì:**
- `apps/web/src/components/header.tsx`: thêm input search → `router.push('/products?q='+encodeURIComponent(v))`.
- `apps/web/src/app/products/page.tsx`: thêm input search + filter khoảng giá (min/max) + ngôn ngữ; gọi `/api/search` khi có `q`/filter, ngược lại giữ `/api/products`. Giữ state qua `useSearchParams`.
- Dùng `useDebounce` (300ms) cho input q.

**Verify:**
- [CHẠY] Build web qua; gõ chữ → URL đổi `?q=`, list lọc.
- [ỔN] Filter kết hợp (q + category + price) hoạt động; reset filter về list thường.
- [TỐT] UI dùng class `.input`/`.chip` đồng bộ design system; accessible (label ẩn cho input).
- [TỐI ƯU] Debounce search, không gọi API mỗi ký tự; abort request cũ nếu có.

### Task 2.5 — Hạ tầng docker + env
**Làm gì:**
- `infrastructure/docker/docker-compose.yml`: thêm service `meilisearch` (`getmeili/meilisearch:v1.12`, port 7700, volume `meili_data`, env `MEILI_MASTER_KEY`).
- `.env.example`: thêm `MEILI_HOST`, `MEILI_MASTER_KEY`.
- `apps/api/package.json` đã add `meilisearch` (Task 2.1).

**Verify:**
- [CHẠY] `docker compose up -d meilisearch` lên xanh; `curl $MEILI_HOST/health` → `{"status":"available"}`.
- [ỔN] Master key bảo vệ; không expose không cần thiết.
- [TỐT] Env có ví dụ rõ.
- [TỐI ƯU] Volume persistent, data không mất khi restart.

---

## 3. PRODUCT DETAIL NÂNG CAO (2.1)

### Task 3.1 — Backend trả payload đầy đủ
**Làm gì:**
- `products.service.ts` `findOneBySlug`: `include { category, tiers, reviews:{ where:{status:'APPROVED'}, select:{rating} } }`, tính `avgRating = avg(reviews.rating)`, `reviewCount = reviews.length` (chỉ APPROVED), trả thêm `images, docs, changelog, demoUrl, language`.
- `findAll`/list thêm `language` (dùng cho filter).

**Verify:**
- [CHẠY] `GET /api/products/:slug` trả JSON có `tiers[], avgRating, reviewCount, images, docs, changelog, demoUrl`.
- [ỔN] SP nháp vẫn ẩn với user thường; admin xem được.
- [TỐT] Tính avg bằng Prisma `_avg` hoặc reduce (tránh query riêng).
- [TỐI ƯU] `reviews` chỉ select `rating` (không lấy comment/body) khi tính avg → nhẹ.

### Task 3.2 — Component tabs (shadcn/ui)
**Làm gì:**
- `apps/web/src/components/ui/tabs.tsx`: wrap `@radix-ui/react-tabs` (thêm `@radix-ui/react-tabs` vào web package.json), style `.chip` active + `.tab-content`.
- `apps/web/src/components/product-tabs.tsx`: 4 tab Mô tả / Tài liệu / Changelog / Reviews.

**Verify:**
- [CHẠY] Build web qua; tab chuyển được.
- [ỔN] Tab hoạt động bằng bàn phím (arrow/Enter), `aria` đúng.
- [TỐT] Đồng bộ style design system.
- [TỐI ƯU] Tab content lazy (chỉ Reviews fetch khi mở tab).

### Task 3.3 — Gallery
**Làm gì:**
- `apps/web/src/components/product-gallery.tsx`: ảnh chính + thumbnails (`images[]`); fallback 1 ảnh = `thumbnail`. Nút prev/next, click thumbnail đổi ảnh.

**Verify:**
- [CHẠY] Hiển thị đúng list ảnh; fallback khi `images` rỗng.
- [ỔN] Ảnh lỗi (broken) → ẩn/không crash layout.
- [TỐT] Accessible: `alt` mô tả, button có `aria-label`.
- [TỐI ƯU] `loading="lazy"` cho thumbnail, ảnh chính eager.

### Task 3.4 — Gắn vào trang `[slug]`
**Làm gì:**
- `apps/web/src/app/products/[slug]/page.tsx`: tách gallery + tabs; chừa slot `<LicenseSelector product={product} />` (Task 6) trong buy box và `<ProductReviews productId={id} />` (Task 4) trong tab Reviews. Cập nhật type `Product` trong `lib/use-products.ts` (thêm `images, docs, changelog, demoUrl, language, tiers, avgRating, reviewCount`).

**Verify:**
- [CHẠY] Trang detail build & hiển thị đầy đủ gallery/tabs.
- [ỔN] Slot license/reviews render được (sau làm phần 4,6).
- [TỐT] Type `Product` đồng bộ web ↔ api.
- [TỐI ƯU] Không fetch dư; tái dùng `useProducts` đã có.

### Task 3.5 — Sản phẩm liên quan (related products)
**Làm gì:**
- Backend: `products.service.ts` thêm `getRelated(slug, limit=4)`: lấy cùng `categoryId`, loại trừ chính nó, chỉ `isPublished:true`, sắp xếp `createdAt` mới hoặc `reviewCount` cao. Có thể dùng MeiliSearch (`filter categoryId`, exclude id) nếu muốn relevance tốt hơn.
- Web: `apps/web/src/components/related-products.tsx` (grid tái dùng `ProductCard`) + gọi `GET /api/products/:slug/related`. Gắn dưới trang `[slug]`.

**Verify:**
- [CHẠY] Trang detail hiện 4 SP liên quan.
- [ỔN] Không hiện SP hiện tại; SP nháp không lọt vào related.
- [TỐT] Tiêu đề section rõ; responsive grid.
- [TỐI ƯU] Giới hạn `limit=4`, 1 query; không fetch nếu SP ít.

---

## 4. REVIEWS & RATING (2.3)

### Task 4.1 — Reviews module backend
**Làm gì:**
- `apps/api/src/reviews/`: `reviews.module.ts`, `reviews.service.ts`, `reviews.controller.ts`, `dto/create-review.dto.ts` (`rating` 1–5, `comment?` ≤1000).
- `GET /products/:id/reviews` (công khai): CHỈ list `status=APPROVED` + `avgRating` (trên APPROVED) + `count` (APPROVED).
- `POST /products/:id/reviews` (`JwtAuthGuard`): tạo với `status=PENDING`, catch `P2002` unique(productId,userId) → `409`.
- `GET /reviews` (`ADMIN`): list TẤT CẢ (gồm PENDING); `PATCH /reviews/:id/approve` → `APPROVED`; `DELETE /reviews/:id` (chủ hoặc ADMIN).

**Verify:**
- [CHẠY] `POST` review → lưu (PENDING); `GET` trả list APPROVED + avg.
- [ỔN] User chưa login → 401; trùng review → 409; DTO sai → 400; review PENDING không hiện công khai.
- [TỐT] Message lỗi tiếng Việt rõ.
- [TỐI ƯU] Index `Review.productId`; truy vấn avg dùng Prisma aggregate.

### Task 4.2 — Web: form + list review
**Làm gì:**
- `apps/web/src/components/review-form.tsx`: form rating (select 1–5) + comment; gửi qua `useApi()` (token tự gắn). Nếu chưa login → nút "Đăng nhập".
- `apps/web/src/components/review-list.tsx`: hiển thị list + avg + count.
- Gắn vào tab Reviews (Task 3.4).

**Verify:**
- [CHẠY] Gửi review thành công, list cập nhật.
- [ỔN] Validate client (rating bắt buộc, comment ≤1000); hiển thị lỗi API.
- [TỐT] Accessible form (label, aria-invalid).
- [TỐI ƯU] Sau submit → refetch list (không reload trang).

### Task 4.3 — Admin moderation
**Làm gì:**
- `apps/admin/src/pages/Reviews.tsx` (mới) + route `/reviews` trong `App.tsx`: bảng review (user, product, rating, comment, status, ngày), nút "Duyệt" (`PATCH /api/reviews/:id/approve`) + nút xóa (`DELETE /api/reviews/:id`).
- Gọi `GET /api/reviews` (tất cả, gồm PENDING).

**Verify:**
- [CHẠY] Trang admin hiện list (gồm PENDING), duyệt + xóa được.
- [ỔN] Chỉ ADMIN truy cập; duyệt PENDING → APPROVED hiện công khai.
- [TỐT] Đồng bộ style `.card`/`.chip` admin.
- [TỐI ƯU] Phân trang nếu nhiều review.

---

## 5. COUPON + ĐA LICENSE (2.5 + 2.6)

### Task 5.1 — Coupon module backend
**Làm gì:**
- `apps/api/src/coupons/`: CRUD (`POST/GET/PATCH/DELETE /coupons`, ADMIN). DTO có validate `type, value, code` unique.
- Helper `validateCoupon(code, total)`: check `active`, `expiresAt`, `minOrder`, tính giảm (PERCENT có `maxDiscount`, FIXED trừ thẳng, `total ≥ 0`).

**Verify:**
- [CHẠY] Tạo coupon → lưu; `GET` list được.
- [ỔN] Code trùng → 409; hết hạn → validate fail; minOrder chưa đạt → fail.
- [TỐT] Message lỗi rõ (tiếng Việt).
- [TỐI ƯU] `Coupon.code` unique index; không tính lại mỗi request vô ích.

### Task 5.2 — LicenseTier CRUD lồng products
**Làm gì:**
- Trong `products.module/controller/service`: `POST/GET/PATCH/DELETE /products/:id/tiers[/:tierId]` (ADMIN). `ProductsService` include `tiers` khi findOne/findAll.

**Verify:**
- [CHẠY] Tạo tier → gắn SP; list SP có `tiers`.
- [ỔN] Slug trùng trong 1 SP → 409; xóa SP → tier cascade.
- [TỐT] DTO validate `price≥0`.
- [TỐI ƯU] Unique `(productId, slug)`.

### Task 5.3 — Orders: giá từ tier + coupon
**Làm gì:**
- `orders.service.ts` `create`: nhận `licenseTierId` + `couponCode?` từ DTO; lấy `price` từ `LicenseTier` (KHÔNG tin client), lưu `tierName` snapshot vào `OrderItem`; áp coupon qua `validateCoupon`, lưu `couponCode` vào `Order`, tính `total` cuối.
- `confirmPayment`: tạo `License` cho mỗi `OrderItem` với `orderItemId`, `licenseTierId`, `downloadLimit` mặc định 5.
- DTO `create-order.dto.ts`: thêm `items[].licenseTierId?`, `couponCode?`.

**Verify:**
- [CHẠY] Đặt hàng với tier+coupon → total đúng; webhook confirm tạo License.
- [ỔN] Tier không tồn tại → 400; coupon sai → bỏ qua/hủy order; price client gửi sai → vẫn lấy từ DB.
- [TỐT] Snapshot `tierName` để hiển thị sau này dù tier đổi.
- [TỐI ƯU] Transaction tạo order+items+license; không N+1.

### Task 5.4 — Web: cart + selector + checkout
**Làm gì:**
- `lib/cart-store.ts`: `CartItem` thêm `licenseTierId?`, `tierName?`, `unitPrice` (từ tier).
- `app/products/[slug]/page.tsx`: `<LicenseSelector>` chọn tier → `addToCart({...,licenseTierId,tierName,unitPrice})`.
- `app/checkout/page.tsx`: input `couponCode`, gửi `licenseTierId` + `couponCode` lên `POST /orders`; hiển thị total từ **server response** (không tự tính client).

**Verify:**
- [CHẠY] Chọn tier → giỏ đúng giá; nhập coupon → total giảm.
- [ỔN] Coupon sai → checkout báo lỗi; tier bắt buộc trước khi thêm giỏ (nếu SP có tier).
- [TỐT] UX rõ ràng (hiện giá từng tier).
- [TỐI ƯU] Total luôn từ server; client không tự tính tiền.

### Task 5.5 — Admin: quản lý coupon + tier
**Làm gì:**
- `apps/admin/src/pages/Coupons.tsx` + route `/coupons`; `apps/admin/src/pages/ProductTiers.tsx` (hoặc tab trong Products) CRUD tier.
- Gọi endpoint tương ứng.

**Verify:**
- [CHẠY] Tạo/sửa/xóa coupon & tier trên admin được.
- [ỔN] Guard ADMIN; validate form.
- [TỐT] Style đồng bộ.
- [TỐI ƯU] Reuse `apiClient` đã có.

---

## 6. CUSTOMER DASHBOARD (2.4)

### Task 6.1 — Licenses module backend
**Làm gì:**
- `apps/api/src/licenses/`: `GET /licenses/mine` (JwtAuthGuard) → list license (`key, downloadCount, downloadLimit, product, tierName`).
- `GET /licenses/:id/download`: check chủ + `downloadCount < downloadLimit` → tăng count, trả `{ url: await storage.getSignedUrl(product.fileKey) }`; hết lượt → 400. Tái dùng `StorageService.getSignedUrl`.
- Reset định kỳ **theo từng license** (quyết định §9): thêm `apps/api/src/licenses/reset.service.ts` dùng `@nestjs/schedule` (`pnpm add @nestjs/schedule`, `app.module` register `ScheduleModule.forRoot()`). `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)` quét license có `downloadResetAt` cũ hơn 30 ngày → `downloadCount=0` + `downloadResetAt=now()`.

**Verify:**
- [CHẠY] Lấy list license; bấm tải → url signed trả về.
- [ỔN] User khác license → 403; hết lượt → 400; tăng đúng count.
- [TỐT] Message lỗi tiếng Việt.
- [TỐI ƯU] `downloadCount` update atomic (Prisma `update` với điều kiện count).
- [ỔN] (reset) Cron mỗi đêm; license quá 30 ngày được reset `downloadCount=0` + `downloadResetAt`; license <30 ngày không bị reset. Test thủ công: set `downloadResetAt` lùi 31 ngày rồi gọi hàm reset.

### Task 6.2 — Tickets module backend
**Làm gì:**
- `apps/api/src/tickets/`: `POST /tickets`, `GET /tickets/mine` (user); `GET /tickets`, `PATCH /tickets/:id` (ADMIN reply/status).
- DTO: `subject, message` (user); `reply, status` (admin).

**Verify:**
- [CHẠY] Tạo ticket → hiện trong `/mine`; admin reply → status REPLIED.
- [ỔN] User chỉ sửa ticket của mình; admin sửa mọi ticket.
- [TỐT] Validate input.
- [TỐI ƯU] Index `Ticket.userId`.

### Task 6.3 — Web: dashboard page
**Làm gì:**
- `apps/web/src/app/dashboard/page.tsx` (mới, protected bởi middleware): 3 tab Đơn hàng / License / Hỗ trợ.
- `components/dashboard/order-list.tsx` (tái dùng từ `/orders` cũ hoặc mới), `license-list.tsx` (nút tải + progress `downloadCount/downloadLimit`), `ticket-form.tsx`, `ticket-list.tsx`.
- `components/header.tsx`: đổi link `/orders` → `/dashboard`.

**Verify:**
- [CHẠY] Dashboard build; 3 tab hoạt động; nút tải gọi `/licenses/:id/download`.
- [ỔN] Chưa login → middleware đẩy `/login`; tải hết lượt → báo lỗi.
- [TỐT] Accessible tabs; style đồng bộ.
- [TỐI ƯU] Fetch theo tab (lazy); không load hết 1 lần.

### Task 6.4 — Admin: tickets page
**Làm gì:**
- `apps/admin/src/pages/Tickets.tsx` + route `/tickets`: list ticket, form reply + đổi status.

**Verify:**
- [CHẠY] List + reply được.
- [ỔN] Guard ADMIN.
- [TỐT] Style đồng bộ.
- [TỐI ƯU] Reuse `apiClient`.

---

## 7. ADMIN BỔ SUNG (gộp)
Đã phân rải vào Task 4.3, 5.5, 6.4. Riêng `product-form.tsx` cần mở rộng:
### Task 7.1 — Mở rộng ProductForm admin
**Làm gì:** Thêm field `images` (nhập nhiều URL, dạng comma/textarea), `docs`/`changelog` (JSON textarea hoặc đơn giản), `demoUrl`, `language`. Gửi lên `POST/PATCH /products`.
**Verify:**
- [CHẠY] Lưu được gallery/demoUrl/language.
- [ỔN] Validate JSON docs/changelog (try/catch, báo lỗi).
- [TỐT] UI rõ ràng (tiếng Việt).
- [TỐI ƯU] Parse JSON an toàn, không crash form.

---

## 8. TEST & COMMIT (cuối)
### Task 8.1 — Verify tổng thể
**Làm gì:**
- Chạy `pnpm -r typecheck && pnpm -r build` (web/admin/api).
- Luồng thủ công: search → chi tiết (gallery/tabs) → chọn tier → thêm giỏ → checkout (coupon) → thanh toán PayOS sandbox → webhook → dashboard tải file (giới hạn 5) → review → admin moderation/tickets/coupons/tiers.
- `pnpm lint` (nếu có).

**Verify:**
- [CHẠY] Mọi app build xanh.
- [ỔN] Luồng mua end-to-end không lỗi; quyền đúng.
- [TỐT] Code review nhanh: không code chết, comment đủ.
- [TỐI ƯU] Không query dư, Meili filter đúng, payload nhỏ.

### Task 8.2 — Commit (9 commit tiếng Việt)
- `feat(api): schema + migration phase2 (review/license-tier/coupon/ticket)`
- `feat(api): search meilisearch + sync`
- `feat(api): reviews module + admin moderation`
- `feat(api): license tiers + coupons + order pricing`
- `feat(api): licenses download-limit + tickets`
- `feat(web): product detail gallery/tabs + license selector + reviews`
- `feat(web): search UI + customer dashboard`
- `feat(admin): tiers/coupons/reviews/tickets management`
- `chore: docker meilisearch + env`
> Mỗi commit kết thúc: `Co-Authored-By: Claude <noreply@anthropic.com>`

---

## 9. QUYẾT ĐỊNH ĐÃ CHỐT (từ user — không còn điểm mở)
1. **Giới hạn tải:** **5 lượt/license**; reset định kỳ **1 tháng/lần theo từng license** (cron mỗi đêm, reset khi `downloadResetAt` quá 30 ngày).
2. **Ticket:** **đơn giản** (1 subject + 1 message + 1 reply admin, status OPEN/REPLIED/CLOSED).
3. **License:** **đổi** `orderId @unique` → `orderItemId @unique` (breaking migration, có backfill).
4. **Filter ngôn ngữ:** **thêm** cột `language String?` + filter MeiliSearch + filter web.
5. **Flash sale:** **dời Phase 3** (Phase 2 chỉ coupon code cơ bản).
6. **Gallery:** admin **nhập URL thủ công** (Phase 2; upload R2 nâng cấp sau).
7. **docs/changelog:** kiểu **`Json?`** (có cấu trúc `[{...}]`).
8. **Review:** **chờ admin duyệt** (status PENDING → APPROVED; công khai chỉ APPROVED).
9. **Related products:** **làm luôn** ở Phase 2 (cùng category, limit 4).

---

**Trạng thái:** Mọi quyết định đã chốt đầy đủ. Plan chi tiết theo task + verify đã xong, **chờ bạn duyệt**. Chưa code bất kỳ dòng nào.
