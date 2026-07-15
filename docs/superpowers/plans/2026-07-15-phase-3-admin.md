# Plan Phase 3 — Admin Panel Toàn Diện (KPI · CRM · RBAC · CMS · Helpdesk)

> **Mục tiêu**: Nâng Admin từ "quản lý cơ bản" (Phase 2: products/reviews/coupons/tickets) lên **Admin Panel toàn diện**: báo cáo KPI có biểu đồ, quản lý khách hàng (CRM), phân quyền (RBAC), quản lý nội dung (CMS: blog + trang tĩnh), và helpdesk nâng cao (phân công + email).
>
> **Nguyên tắc bắt buộc** (theo yêu cầu user): Mỗi mục → chia từng task → mỗi task ghi rõ **làm gì** + **Verify 4 mức** (`[CHẠY]` build/typecheck xanh · `[ỔN]` logic + edge case + guard · `[TỐT]` convention tiếng Việt, tái dùng · `[TỐI ƯU]` không N+1, index đúng, debounce, DTO validate).
>
> **Hiện trạng đã có (không làm lại)**: `stats.getStats()` (4 tổng), `tickets` module (CRUD + reply/close + admin list), `categories` module, `email` service (Resend) trong `common/email`, admin Layout có 6 nav, `RolesGuard` + `@Roles(Role.ADMIN)`.

---

## Mục 1 — Schema & Migration mở rộng

**1.1 Mở rộng `Role` enum + `User`**
- Thêm `STAFF` vào `enum Role { CUSTOMER ADMIN STAFF }`.
- `User` thêm `isActive Boolean @default(true)` (khóa/mở tài khoản CRM).
- **Verify**: `[CHẠY]` `prisma migrate dev` sinh migration `phase3_admin`; `prisma generate` xanh. `[ỔN]` user cũ (`CUSTOMER`) vẫn login được; `isActive=false` chặn login. `[TỐT]` comment tiếng Việt giải thích STAFF = nhân viên hỗ trợ. `[TỐI ƯU]` index `User.email`, `User.role`.

**1.2 Model `Post` (CMS: blog + trang tĩnh)**
- `Post { id, type Enum(POST|PAGE), title, slug @unique, excerpt, content String, coverImage String?, status Enum(DRAFT|PUBLISHED), categoryId?, publishedAt?, authorId, seoTitle?, seoDescription?, viewCount Int @default(0), createdAt, updatedAt }`.
- Relation `author -> User`, `category -> Category?`.
- **Verify**: `[CHẠY]` migrate + generate xanh. `[ỔN]` unique slug; xóa post không mất user. `[TỐT]` `type` phân biệt blog/page để route web tách biệt. `[TỐI ƯU]` `@@index([type, status, publishedAt])` cho query list.

**1.3 Mở rộng `Ticket` (Helpdesk)**
- Thêm `priority Enum(LOW|MEDIUM|HIGH) @default(MEDIUM)`, `assignedToId?`, relation `assignedTo -> User?`, `closedAt?`.
- **Verify**: `[CHẠY]` migrate xanh. `[ỔN]` ticket cũ (không có assignedTo) vẫn list được. `[TỐT]` enum status giữ `OPEN/REPLIED/CLOSED`. `[TỐI ƯU]` index `status, assignedToId`.

**1.4 Seed dữ liệu mẫu**
- Seed 1 `STAFF` (email `staff@sourceban.com`, password biết trước để test RBAC), 2-3 `Post` (1 blog + 1 trang FAQ), gán vài ticket vào staff.
- **Verify**: `[CHẠY]` `pnpm prisma:seed` chạy xanh, log "Seed xong…". `[ỔN]` staff login được, truy cập được tickets/orders. `[TỐT]` password test ghi rõ trong kế hoạch bàn giao.

---

## Mục 2 — KPI nâng cao (Stats + Dashboard charts)

**2.1 Mở rộng `StatsService`**
- Thêm: `revenueByDay(lastN=30)` (group by ngày các order PAID), `orderStatusBreakdown()`, `topProducts(limit=5)` (join OrderItem + Product, sum qty), `recentOrders(limit=5)`, `newUsers(lastN=30)`.
- **Verify**: `[CHẠY]` build xanh. `[ỔN]` không có order nào → trả mảng rỗng, không divide-by-zero. `[TỐT]` hàm tái dùng, truy vấn dùng `$transaction` gộp. `[TỐI ƯU]` dùng `groupBy`/`_sum` của Prisma thay vì fetch rồi reduce; index `order.createdAt`, `order.status`.

**2.2 API `/stats` mở rộng**
- `@Get('overview')` trả tổng + breakdown + topProducts + recentOrders; `@Get('revenue')` trả time-series. Guard `ADMIN` (và `STAFF` chỉ xem tổng, không xem revenue — tuỳ quyết định 2.4).
- **Verify**: `[CHẠY]` curl `/stats/overview` trả JSON đúng shape. `[ỔN]` sai role → 403. `[TỐT]` DTO/swagger mô tả. `[TỐI ƯU]` cache 60s (nếu có CacheModule) hoặc tính nhẹ.

**2.3 Admin Dashboard vẽ biểu đồ**
- Dùng **visx (d3)** *(đã chốt)* vẽ: doanh thu 30 ngày (line/area), trạng thái đơn (donut), top sản phẩm (bar), bảng recent orders. Giữ layout `.card`/`.chip` hiện có.
- **Verify**: `[CHẠY]` `pnpm --filter admin build` xanh, trang `/dashboard` render chart. `[ỔN]` mobile responsive; không có data → empty state. `[TỐT]` component `<KpiCard>`/`<ChartCard>` tái dùng. `[TỐI ƯU]` fetch 1 lần (`/stats/overview`), không gọi N endpoint; skeleton loading.

**2.4 Phân quyền KPI** *(đã chốt: B — Chỉ ADMIN xem revenue)*
- `ADMIN`+`STAFF` đều xem overview (đơn, user, top sản phẩm); **chỉ `ADMIN`** xem doanh thu chi tiết/time-series (`/stats/revenue`). `STAFF` gọi `/stats/revenue` → 403.

---

## Mục 3 — CRM: Users module (API + Admin)

**3.1 API `users` module**
- `GET /users` (list + search theo email/name, phân trang, filter `role`/`isActive`), `GET /users/:id` (profile + orders + licenses + tickets + reviews của user — include có chọn lọc, chống N+1), `PATCH /users/:id/role` (đổi role, chỉ ADMIN), `PATCH /users/:id/active` (khóa/mở, chỉ ADMIN), `GET /users/:id/orders`, `GET /users/:id/licenses`.
- **Verify**: `[CHẠY]` build xanh, route map đúng. `[ỔN]` user không tồn tại → 404; đổi role chính mình bị từ chối. `[TỐT]` guard `ADMIN` cho role/active; `STAFF` chỉ xem list/profile. `[TỐI ƯU]` `include` chọn trường cần, `take/skip` phân trang, index `email`.

**3.2 Admin trang `Users.tsx`**
- Bảng users: avatar/email/name/role/chỉ số (số đơn, số license), filter role + active, search debounce, nút "Chi tiết".
- Modal/panel chi tiết: thông tin + tabs (Đơn hàng / License / Ticket / Review) + hành động đổi role / khóa.
- **Verify**: `[CHẠY]` build xanh, trang `/users` render, filter/search hoạt động. `[ỔN]` khóa user → user đó login bị từ chối (test qua API). `[TỐT]` dùng lại `apiClient`, component bảng chung. `[TỐI ƯU]` debounce search 300ms, không refetch khi gõ.

**3.3 Thêm nav + route**
- Layout thêm `{ to: '/users', label: 'Khách hàng', icon }`; `ProtectedRoute` mở cho `ADMIN` (+`STAFF` xem).
- **Verify**: `[CHẠY]` navigate `/users` được, không redirect login. `[ỔN]` `CUSTOMER` truy cập → 403/redirect.

---

## Mục 4 — RBAC (phân quyền)

**4.1 Quản lý vai trò trong CRM** (dựa 3.1 `PATCH /users/:id/role`)
- Admin đổi `CUSTOMER ↔ STAFF ↔ ADMIN`. Giao diện dropdown trong modal user.
- **Verify**: `[CHẠY]` đổi role staff→admin qua API reflect đúng. `[ỔN]` không tự hạ cấp mình thành CUSTOMER; không thể tạo ADMIN vượt quyền. `[TỐT]` log hành động (audit đơn giản).

**4.2 Route guard phía admin**
- `ProtectedRoute` nhận `allowedRoles?: Role[]`; mặc định `[ADMIN]`, trang CRM/Posts yêu cầu `[ADMIN]`, tickets/orders cho `[ADMIN, STAFF]`.
- **Verify**: `[CHẠY]` STAFF vào `/products` bị chặn, vào `/tickets` được. `[ỔN]` token hết hạn → về login. `[TỐT]` thông báo "Không có quyền" rõ ràng.

**4.3 API endpoint protection rà soát**
- Đảm bảo mọi `@Controller` admin có `RolesGuard` + `@Roles` đúng; endpoints nhạy cảm (stats/revenue, user role) chỉ `ADMIN`.
- **Verify**: `[CHẠY]` curl không token → 401; role sai → 403. `[ỔN]` không lọt endpoint nào không guard. `[TỐT]` danh sách quyền tập trung (hằng `ROLE_ACCESS`).

---

## Mục 5 — CMS: Posts / Pages (API + Admin + Web)

**5.1 API `posts` module**
- `GET /posts` (public list, filter `type`/`category`/`status=PUBLISHED`, phân trang, sort `publishedAt desc`), `GET /posts/:slug` (public detail, tăng `viewCount`), `POST /posts` (admin tạo, validate), `PATCH /posts/:id`, `DELETE /posts/:id` (admin). Dùng `slugify` tiêu đề. `content` lưu **Markdown** *(đã chốt)*.
- **Verify**: `[CHẠY]` build xanh. `[ỔN]` bài DRAFT không hiện ở public; slug trùng → lỗi validate. `[TỐT]` DTO `CreatePostDto`/`UpdatePostDto` có `class-validator` (Length, IsEnum). `[TỐI ƯU]` public query có index `(type,status,publishedAt)`; viewCount tăng an toàn (không race).

**5.2 Admin trang `Posts.tsx`**
- Bảng bài viết (tiêu đề, loại, trạng thái, ngày), nút "Viết mới" mở editor (title, slug auto, excerpt, content textarea, cover URL, type POST/PAGE, category, SEO). Preview.
- **Verify**: `[CHẠY]` build xanh; tạo/sửa/xóa bài qua UI phản ánh đúng DB. `[ỔN]` xóa bài → không crash trang web. `[TỐT]` dùng chung `product-form` style; nút publish/draft. `[TỐI ƯU]` autosave nháp (tuỳ chọn), debounce slug.

**5.3 Web hiển thị CMS**
- Trang `/blog` (list bài POST), `/blog/[slug]` (chi tiết, **render Markdown** bằng `react-markdown` + `remark-gfm`, SEO meta), `/[page]` hoặc `/pages/[slug]` cho PAGE tĩnh (FAQ, About, Terms) — link từ footer.
- **Verify**: `[CHẠY]` `next build` xanh; `/blog` và `/blog/[slug]` render. `[ỔN]` bài DRAFT → 404 public; trang không tồn tại → not-found. `[TỐT]` metadata (title/description) chuẩn SEO. `[TỐI ƯU]` ISR/`generateStaticParams` cho bài PUBLIC; không fetch N+1.

**5.4 Thêm nav + route**
- Layout admin thêm `{ to: '/posts', label: 'Nội dung', icon }`; web footer thêm link Blog / FAQ.
- **Verify**: `[CHẠY]` navigate đúng. `[ỔN]` CUSTOMER vào `/posts` admin → 403.

---

## Mục 6 — Helpdesk nâng cao (Tickets)

**6.1 API tickets mở rộng**
- `GET /tickets/admin` hỗ trợ filter `status`/`priority`/`assignedTo` + search; `PATCH /tickets/admin/:id/assign` (gán staff, ADMIN); `POST /tickets` nhận `priority`; khi tạo ticket → **gửi email notify** cho staff (dùng `email` service); khi admin reply → **gửi email** cho user.
- **Verify**: `[CHẠY]` build xanh. `[ỔN]` gán cho user không phải STAFF/ADMIN → từ chối; email lỗi không crash (try/catch). `[TỐT]` template email tiếng Việt. `[TỐI ƯU]` queue/gửi async (không block response).

**6.2 Admin `Tickets.tsx` nâng cấp**
- Bộ lọc (status/priority/người nhận), search, badge ưu tiên, nút "Phân công", mở ticket xem hội thoại + reply + đóng.
- **Verify**: `[CHẠY]` build xanh; filter/search hoạt động; phân công reflect. `[ỔN]` **STAFF thấy tất cả ticket** *(đã chốt)*, có thể lọc theo người nhận. `[TỐT]` tái dùng component badge. `[TỐI ƯU]` polling/refresh nhẹ, không refetch thừa.

**6.3 Web phía khách**
- Trang `/dashboard` tab Hỗ trợ: tạo ticket có chọn `priority`, xem lịch sử, nhận email khi admin phản hồi.
- **Verify**: `[CHẠY]` tạo ticket thành công, hiển thị trong tab. `[ỔN]` validate subject/message (Length). `[TỐT]` UX tiếng Việt.

---

## Mục 7 — Test & Commit

**7.1 Build & typecheck 3 app**
- `pnpm --filter api build` + `pnpm --filter web build` + `pnpm --filter admin build` đều xanh.
- **Verify**: `[CHẠY]` 3 app build xanh. `[ỔN]` không lỗi ESLint nghiêm trọng. `[TỐT]` commit tiếng Việt. `[TỐI ƯU]` không code chết.

**7.2 Luồng e2e tay (script kiểm thử)**
- Đăng nhập ADMIN → xem KPI có chart → tạo bài blog → xem trên web `/blog` → tạo user STAFF → đổi role → STAFF login → xử lý ticket (phân công + reply + nhận email) → khóa 1 user → user đó login bị từ chối.
- **Verify**: `[CHẠY]` toàn bộ luồng qua được. `[ỔN]` edge case (user bị khóa, ticket không assign). `[TỐT]` ghi lại tài khoản test. `[TỐI ƯU]` script curl mẫu lưu `scripts/smoke-phase3.sh`.

**7.3 9 commit tiếng Việt** (theo từng mục lớn): schema/rbac, stats+kpi, users/crm, rbac-guard, posts-api, posts-admin, web-cms, tickets-helpdesk, test+commit.

---

## Quyết định đã chốt với user (trước implement)
1. **RBAC KPI (2.4)**: ✅ Chỉ `ADMIN` xem revenue; `STAFF` chỉ xem overview.
2. **CMS render (5.1/5.3)**: ✅ Lưu **Markdown**, render bằng `react-markdown` + `remark-gfm`.
3. **Helpdesk (6.2)**: ✅ `STAFF` thấy **tất cả** ticket (đội nhỏ).
4. **Chart lib (2.3)**: ✅ **visx (d3)**.

## Critical files
- `apps/api/prisma/schema.prisma` (Role, User, Post, Ticket mở rộng; migration `phase3_admin`)
- `apps/api/src/stats/*` (KPI mở rộng)
- `apps/api/src/users/*` (mới — CRM)
- `apps/api/src/posts/*` (mới — CMS)
- `apps/api/src/tickets/*` (mở rộng assign/email/priority)
- `apps/api/src/auth/guards/roles.guard.ts`, `apps/admin/src/components/ProtectedRoute.tsx` (RBAC)
- `apps/admin/src/pages/{Dashboard,Users,Posts,Tickets}.tsx`, `Layout.tsx`
- `apps/web/src/app/{blog,blog/[slug],pages/[slug]}.tsx` (CMS web)
- `apps/api/src/common/email/email.service.ts` (notify)

## Thứ tự thực hiện
Mục 1 (schema) → 4 (RBAC base) → 3 (CRM) → 2 (KPI) → 5 (CMS) → 6 (Helpdesk) → 7 (test/commit).
Mỗi mục xong chạy Verify 4 mức trước khi sang mục sau.
