# Phase 4 — Module Dịch Vụ Custom — Kế Hoạch Triển Khai (chi tiết từng task)

> **Mục tiêu (theo `docs/ke-hoach-chi-tiet-theo-phase.md` §4):** Quy trình nhận & quản lý dự án custom chuyên nghiệp, end-to-end: khách gửi yêu cầu báo giá → admin nhận trên Kanban → báo giá → khách chốt & ký → phát triển theo milestone (thu tiền đa kỳ) → bàn giao có versioning → bảo hành. Giao tiếp khách-admin tập trung trên hệ thống thay vì email/Excel.
>
> **Tiền đề:** Đã implement đủ Phase 1 (auth NextAuth+JWT, PayOS, Resend, R2, orders, webhook) + Phase 2 (MeiliSearch, reviews, multi-license, coupons, customer dashboard) + Phase 3 (KPI, CRM, RBAC, CMS, Helpdesk). Phase 3 đã verify hoàn thành đầy đủ (migration `phase3_admin`, modules users/posts/tickets/stats, RBAC guard, visx charts).
>
> **Quy ước Verify (mọi task):** `[CHẠY]` build/typecheck xanh · `[ỔN]` logic + edge case + guard đúng · `[TỐT]` convention tiếng Việt, tái dùng util · `[TỐI ƯU]` không N+1, index đúng, debounce, DTO validate.
>
> **Stack:** NestJS 11 + Prisma + Postgres (api:3001), Next.js 15 App Router (web:3000), React 19 + Vite (admin:3002), pnpm. `next.config.ts` rewrite `/api/*` → NestJS; `middleware.ts` bảo vệ `/dashboard` & `/admin`.
>
> **Quy ước file:** `YYYY-MM-DD-phase-N-<tên>.md` trong `docs/superpowers/plans/`.

---

## QUYẾT ĐỊNH ĐÃ CHỐT (user duyệt 2026-07-16 — không còn điểm mở)

1. **Milestone mặc định:** 3 mốc — Đặt cọc 30% / Giữa kỳ 40% / Bàn giao 30% (auto-generate khi CONFIRMED; validate tổng % = 100).
2. **Hợp đồng:** Chỉ xác nhận scope bằng checkbox/text + lưu `contractSignedAt` (+ PDF hợp đồng thủ công vào `contractKey`). **Không** tích hợp e-signature thật (để Phase sau).
3. **Bảo hành:** Mặc định **3 tháng** (`warrantyMonths=3`), tính `warrantyEndAt` từ DELIVERED.
4. **Trao đổi:** Message list + form gửi, **load lại khi submit** (KHÔNG WebSocket realtime).
5. **Thông báo:** Tạo model **`Notification`** riêng + email (tái dùng cho phase sau: order, license).
6. **Form báo giá:** **KHÔNG yêu cầu login** (`POST /api/custom-requests` public; `userId` nullable khi khách vãng lai).
7. **Portfolio:** Lấy từ `CustomProject` có `status=DELIVERED` & `isShowcase=true` (tách biệt CMS `Post`).
8. **Route portfolio:** **`/du-an`** (Tiếng Việt, SEO local).
9. **Model Payment:** Tạo **`Payment` riêng** (liên kết linh hoạt `orderId` | `milestoneId`), tái dùng webhook Phase 1, không phá `Order`.
10. **Link thanh toán milestone:** **Khách tự bấm "Thanh toán"** trong dashboard (route `pay-link` guard chủ dự án HOẶC ADMIN).

---

## TỔNG QUAN KIẾN TRÚC (tổng hợp research)

**5 model mới + 4 enum** (chi tiết §1):
- `CustomProjectRequest` — yêu cầu báo giá từ khách (form public)
- `CustomProject` — dự án đã tiếp nhận (Kanban, 7 trạng thái)
- `Milestone` — thanh toán theo giai đoạn
- `ProjectMessage` — trao đổi khách ↔ admin
- `ProjectFile` — đính kèm/deliverable có versioning
- Enum: `ProjectStatus` (NEW→QUOTING→CONFIRMED→IN_PROGRESS→REVIEW→DELIVERED→WARRANTY+CANCELLED), `ProjectType`, `ProjectFileKind`, `MilestoneStatus`
- Mở rộng `Payment` (tạo model riêng, liên kết linh hoạt `orderId` | `milestoneId`)

**Luồng tổng thể:**
```
Khách (không cần login) → /bao-gia → POST /api/custom-requests → email notify admin
  → Admin vào Kanban (/custom-projects) thấy thẻ NEW
  → Quote → chuyển QUOTING → CONFIRMED (khách ký scope)
  → Tạo Milestone (30/40/30) → IN_PROGRESS → REVIEW → DELIVERED (upload file versioning)
  → WARRANTY (theo dõi thời hạn)
Khách theo dõi ở /dashboard tab "Dự án của tôi": timeline, milestone + nút thanh toán, message thread, notification
```

---

## 1. SCHEMA + MIGRATION (nền tảng — làm đầu tiên)

### Task 1.1 — Cập nhật `schema.prisma`
**Làm gì:**
- Thêm 4 enum: `ProjectStatus`, `ProjectType`, `ProjectFileKind`, `MilestoneStatus`.
- Thêm 5 model: `CustomProjectRequest`, `CustomProject`, `Milestone`, `ProjectMessage`, `ProjectFile` (schema chi tiết ở dưới).
- Thêm relation ngược vào `User`: `customRequests`, `customerProjects` (`@relation("CustomerProject")`), `assignedProjects` (`@relation("ProjectAssignee")`), `projectMessages`, `projectFiles`.
- Mở rộng `Payment` (tạo model riêng nếu chưa có — hiện Phase 1 lưu `providerRef` trên `Order`; đề xuất tách `Payment` riêng để milestone tái dùng, không phá Order): thêm `milestoneId?`, `projectId?` (denormalized), giữ `orderId?`.

**Schema đề xuất:**
```prisma
enum ProjectStatus {
  NEW QUOTING CONFIRMED IN_PROGRESS REVIEW DELIVERED WARRANTY CANCELLED
}
enum ProjectType { WEB_APP MOBILE_APP DESKTOP_APP EXTENSION INTEGRATION OTHER }
enum ProjectFileKind { REQUEST_ATTACHMENT DELIVERABLE MESSAGE_ATTACHMENT }
enum MilestoneStatus { PENDING INVOICED PAID SKIPPED }

model CustomProjectRequest {
  id          String       @id @default(cuid())
  userId      String
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  type        ProjectType
  title       String
  description String
  budget      Int?         // VND, nullable nếu "thỏa thuận"
  deadline    DateTime?
  status      ProjectStatus @default(NEW)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  project     CustomProject?
  @@index([userId]) @@index([status]) @@index([type])
}
model CustomProject {
  id             String       @id @default(cuid())
  requestId      String       @unique
  request        CustomProjectRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  userId         String
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  assigneeId     String?
  assignee       User?        @relation("ProjectAssignee", fields: [assigneeId], references: [id])
  title          String
  description    String?
  status         ProjectStatus @default(NEW)
  quotedAmount   Int?
  contractKey    String?      // key R2 nếu có e-sign/scope PDF
  contractSignedAt DateTime?
  warrantyMonths Int          @default(3)
  warrantyEndAt  DateTime?
  isShowcase     Boolean      @default(false) // hiện trên /du-an
  slug           String?      @unique          // cho portfolio detail
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  milestones     Milestone[]
  messages       ProjectMessage[]
  files          ProjectFile[]
  @@index([status]) @@index([assigneeId]) @@index([userId]) @@index([slug])
}
model Milestone {
  id         String          @id @default(cuid())
  projectId  String
  project    CustomProject   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name       String
  description String?
  amount     Int             // VND
  percent    Int?
  dueDate    DateTime?
  status     MilestoneStatus @default(PENDING)
  paidAt     DateTime?
  sortOrder  Int             @default(0)
  paymentId  String?
  payment    Payment?        @relation(fields: [paymentId], references: [id])
  createdAt  DateTime        @default(now())
  @@index([projectId]) @@index([status])
}
model ProjectMessage {
  id        String        @id @default(cuid())
  projectId String
  project   CustomProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  senderId  String
  sender    User          @relation(fields: [senderId], references: [id], onDelete: Cascade)
  content   String
  isFromStaff Boolean     @default(false)
  createdAt DateTime      @default(now())
  @@index([projectId, createdAt]) @@index([senderId])
}
model ProjectFile {
  id         String          @id @default(cuid())
  projectId  String
  project    CustomProject   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  uploaderId String
  uploader   User            @relation(fields: [uploaderId], references: [id], onDelete: Cascade)
  kind       ProjectFileKind
  name       String
  fileKey    String          // key R2
  version    Int             @default(1)
  size       Int?
  mimeType   String?
  createdAt  DateTime        @default(now())
  @@index([projectId, kind]) @@index([uploaderId])
}
// Mở rộng Payment (tạo mới nếu chưa có)
model Payment {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  provider    PaymentProvider
  providerRef String?  // orderCode PayOS (webhook lookup)
  amount      Int
  status      String   @default("PENDING")
  orderId     String?  // thanh toán Order (Phase 1)
  milestoneId String?  // thanh toán Milestone (Phase 4)
  projectId   String?  // denormalized
  createdAt   DateTime @default(now())
  @@unique([provider, providerRef])
  @@index([orderId]) @@index([milestoneId]) @@index([projectId])
}
```

**Verify:**
- [CHẠY] `pnpm --filter api prisma generate` xanh, không lỗi type.
- [ỔN] `@@index` chống N+1 (query list project → include milestones/messages/files không phát sinh query phụ); `onDelete: Cascade` đúng (xóa project → xóa milestone/message/file; xóa user → xóa request/project).
- [TỐT] Comment tiếng Việt giải thích từng trường; enum status khớp 7 cột Kanban.
- [TỐI ƯU] Index `status`, `assigneeId`, `userId`, `slug`; không redundant index.

### Task 1.2 — Tạo & chạy migration
**Làm gì:** `cd apps/api && pnpm prisma migrate dev --name phase4_custom_service`.
**Verify:**
- [CHẠY] `migrate dev` xong, `migrate status` báo synced.
- [ỔN] Data cũ không ảnh hưởng (table mới, không breaking).
- [TỐT] SQL có comment (nếu cần adjust).
- [TỐI ƯU] Không lock bảng lâu.

### Task 1.3 — Seed dữ liệu mẫu (tuỳ chọn, cho demo)
**Làm gì:** Seed 2-3 `CustomProjectRequest` + 1 `CustomProject` DELIVERED `isShowcase=true` (hiện trên `/du-an`), 2-3 `Milestone`, vài `ProjectMessage`, `ProjectFile`.
**Verify:**
- [CHẠY] `pnpm prisma db seed` xanh.
- [ỔN] Upsert không trùng khi seed lại.
- [TỐT] Dữ liệu demo tiếng Việt hợp lý.

---

## 2. BACKEND — CUSTOM-PROJECTS MODULE (song song với schema)

### Task 2.1 — Scaffold module + DTO
**Làm gì:** Tạo `apps/api/src/custom-projects/` (module/controller/service) theo style `products/`. DTO: `CreateRequestDto` (type, title, description, budget?, deadline?, fileKeys?[]), `UpdateProjectDto` (assigneeId?, deadline?, priority? — lưu vào CustomProject hoặc mở rộng field), `CreateMilestoneDto`, `SendMessageDto`, `GenerateMilestonesDto` (totalValue, ratios?).
**Verify:**
- [CHẠY] build xanh, route map.
- [ỔN] DTO validate (class-validator: Length, IsEnum, IsInt Min 0).
- [TỐT] Comment tiếng Việt.
- [TỐI ƯU] DTO tách nested, không trust client price (lấy từ DB).

### Task 2.2 — Request + Project CRUD + Kanban endpoints
**Làm gì:**
- `POST /api/custom-requests` (Public, không cần login) → lưu `CustomProjectRequest`, gửi email notify admin (reuse `EmailService`).
- `GET /api/custom-projects` (ADMIN/STAFF) → list filter `status/assigneeId/priority/search`, trả để FE group theo cột Kanban.
- `GET /api/custom-projects/:id` (ADMIN/STAFF hoặc chủ dự án) → detail include milestones/messages/files.
- `GET /api/custom-projects?status=DELIVERED&isShowcase=true` (Public) → portfolio.
- `GET /api/custom-projects/slug/:slug` (Public) → detail case study.
- `PATCH /api/custom-projects/:id/status` (ADMIN/STAFF) → đổi cột Kanban, trigger email + notification cho user.
- `PATCH /api/custom-projects/:id` (ADMIN/STAFF) → gắn assignee/deadline/priority.
- `POST /api/custom-projects` (ADMIN/STAFF) → tạo project từ request (1-1).
**Verify:**
- [CHẠY] curl các endpoint trả đúng shape.
- [ỔN] Sai role → 403; project không tồn tại → 404; user thường truy cập project người khác → 403.
- [TỐT] Guard `JwtAuthGuard` + `RolesGuard(ADMIN, STAFF)`; public endpoint không guard.
- [TỐI ƯU] `include` chọn trường; `take/skip` phân trang; index đúng.

### Task 2.3 — Milestone + logic thanh toán
**Làm gì:**
- `POST /api/custom-projects/:id/milestones` (ADMIN/STAFF) → tạo milestone (hoặc bulk 30/40/30 qua `generateDefaultMilestones`).
- `POST /api/custom-projects/:id/milestones/:mid/pay-link` (chủ dự án HOẶC ADMIN) → gọi `PaymentsService.createPaymentLink` (mở rộng nhận `description/returnUrl`), lưu `Payment` + link `Milestone.paymentId`.
- `GET /api/custom-projects/:id/milestones` (chủ HOẶC ADMIN/STAFF) → list + status.
- `GET /api/custom-projects/:id/payments` → công nợ (sum milestone PAID vs totalValue).
**Verify:**
- [CHẠY] Tạo milestone → list được; sinh link → trả URL PayOS.
- [ỔN] Tỷ lệ % tổng = 100 (validate); milestone không tồn tại → 404; user khác → 403.
- [TỐT] Snapshot `name`/`amount` để hiển thị sau.
- [TỐI ƯU] Tính công nợ 1 query (aggregate), không N+1.

### Task 2.4 — Webhook PayOS phân nhánh Milestone
**Làm gì:** Mở rộng `PaymentsService.handleWebhook` (Phase 1) — giữ `verifyWebhookSignature`. Lookup `Payment.findByProviderRef(code)` → nếu có `milestoneId` → `customProjectsService.markMilestonePaid()` (cập nhật `Milestone.status=PAID`, `paidAt`), gửi email `sendMilestonePaidEmail` (reuse pattern `sendPaymentSuccess`). Fallback Order như cũ.
**Verify:**
- [CHẠY] Webhook PayOS giả lập (curl với signature) → milestone chuyển PAID + email gửi.
- [ỔN] Signature sai → 400; mã đã xử lý → idempotent (không double mark).
- [TỐT] Code tiếng Việt rõ.
- [TỐI ƯU] Không block response; async email.

### Task 2.5 — ProjectMessage + ProjectFile (upload R2)
**Làm gì:**
- `GET/POST /api/custom-projects/:id/messages` (chủ HOẶC ADMIN/STAFF) → list + gửi (`isFromStaff` theo role sender).
- `POST /api/custom-projects/:id/files` (multipart) → upload R2 (reuse `StorageService`), lưu `ProjectFile` (`kind`: REQUEST_ATTACHMENT | DELIVERABLE | MESSAGE_ATTACHMENT), deliverable auto-increment `version` khi trùng tên.
- `GET /api/custom-projects/:id/files` → list file (có signed URL tải).
**Verify:**
- [CHẠY] Gửi message → hiện trong thread; upload file → có key R2 + URL.
- [ỔN] User không phải chủ → 403; file quá lớn → 400; version tăng đúng.
- [TỐT] Reuse `StorageService.getSignedUrl`.
- [TỐI ƯU] Upload async; limit size (10MB/file, 5 file).

### Task 2.6 — Notification (tùy chọn, xem §Cần xác nhận)
**Làm gì:** Tạo model `Notification { id, userId, type, title, body, refId, isRead, createdAt }`. Khi admin đổi status → tạo row `Notification` (type PROJECT_UPDATE) + email. Web dashboard badge đếm unread.
**Verify:**
- [CHẠY] Đổi status → notification row tạo; web badge hiện.
- [ỔN] Chỉ user chủ nhận notification; không leak notification người khác.
- [TỐT] Tái dùng cho phase sau (order, license).
- [TỐI ƯU] Index `userId, isRead`.

---

## 3. ADMIN — KANBAN BOARD (làm sau backend §2)

### Task 3.1 — Cài đặt + routing
**Làm gì:** `pnpm --filter admin add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`. Sửa `App.tsx` thêm route `/custom-projects` (ADMIN+STAFF), `Layout.tsx` thêm nav "Dự án Custom", `lib/rbac.ts` thêm `'/custom-projects': ['ADMIN','STAFF']`.
**Verify:**
- [CHẠY] build xanh; navigate `/custom-projects` được, không redirect login.
- [ỔN] CUSTOMER truy cập → 403/redirect.
- [TỐT] Nav style đồng bộ.
- [TỐI ƯU] Lazy load page.

### Task 3.2 — KanbanBoard + ProjectCard
**Làm gì:** `components/kanban/KanbanBoard.tsx` (DndContext, 7 cột = enum `ProjectStatus`), `ProjectCard.tsx` (useDraggable: tên/khách/ngân sách/assignee/deadline/priority), `lib/custom-project.ts` (types, statusLabels, statusStyles, formatCurrency từ Orders).
**Verify:**
- [CHẠY] Build xanh; board render 7 cột + card.
- [ỔN] Card kéo được; responsive.
- [TỐT] Tái dùng `.card`/`.chip`/`.btn-*`.
- [TỐI ƯU] Group data 1 lần (GET list rồi group FE), không gọi N endpoint.

### Task 3.3 — Drag-drop đổi status + optimistic
**Làm gì:** `onDragEnd` → `PATCH /api/custom-projects/:id/status` + optimistic update; rollback nếu lỗi.
**Verify:**
- [CHẠY] Kéo card sang cột khác → status đổi trên BE.
- [ỔN] Lỗi mạng → rollback UI; không duplicate card.
- [TỐT] UX tiếng Việt (toast "Đã chuyển sang Đang phát triển").
- [TỐI ƯU] Debounce/guard kéo trùng.

### Task 3.4 — ProjectPanel (modal chi tiết)
**Làm gì:** `components/kanban/ProjectPanel.tsx` — modal: select assignee (GET /users?role=STAFF,ADMIN), date deadline, select priority, list messages, upload file (POST /files). Tab: Tổng quan / Tin nhắn / File.
**Verify:**
- [CHẠY] Mở panel, gắn assignee/deadline, gửi message, upload file được.
- [ỔN] Chỉ ADMIN/STAFF sửa; file lỗi → báo.
- [TỐT] Style đồng bộ modal admin.
- [TỐI ƯU] Lazy load messages/files khi mở panel.

---

## 4. WEB — FORM BÁO GIÁ + PORTFOLIO (song song với backend §2)

### Task 4.1 — Trang form báo giá `/bao-gia`
**Làm gì:** `app/bao-gia/page.tsx` (public) + `components/quote-form.tsx` (client: type select, description, budget select khoảng + input tùy chọn, deadline, file upload presign R2, tên/email). Gọi `POST /api/custom-requests`.
**Verify:**
- [CHẠY] Build xanh; submit form → request tạo (không cần login).
- [ỔN] Validate client (Length, budget số); file giới hạn 10MB/5 file; server error hiển thị.
- [TỐT] UX tiếng Việt rõ; tái dùng primitives.
- [TỐI ƯU] Upload presign async; không block submit.

### Task 4.2 — Trang portfolio `/du-an`
**Làm gì:** `app/du-an/page.tsx` (Server Component, fetch API trực tiếp để SEO/ISR) + `components/portfolio-card.tsx` (reuse product-card pattern) + filter theo `ProjectType`. Metadata tiếng Việt.
**Verify:**
- [CHẠY] `/du-an` render grid case study (chỉ DELIVERED + isShowcase).
- [ỔN] Không hiện dự án chưa bàn giao; filter type hoạt động.
- [TỐT] `generateMetadata` chuẩn SEO.
- [TỐI ƯU] ISR/`generateStaticParams`; không N+1.

### Task 4.3 — Trang detail case study `/du-an/[slug]`
**Làm gì:** `app/du-an/[slug]/page.tsx` (Server Component) — gallery, mô tả, tech stack, timeline, JSON-LD.
**Verify:**
- [CHẠY] Detail render; slug không tồn tại → not-found.
- [ỔN] Ảnh lỗi → fallback.
- [TỐT] Metadata + JSON-LD.
- [TỐI ƯU] Fetch 1 query include relations.

### Task 4.4 — Nav + hook
**Làm gì:** `components/header.tsx` thêm link "Dự án" + "Báo giá"; `lib/use-portfolio.ts`, `lib/use-quote.ts` (reuse `useApi`).
**Verify:**
- [CHẠY] Nav hiện đúng; hook fetch được.
- [ỔN] Không phá nav cũ.
- [TỐT] Tiếng Việt.
- [TỐI ƯU] Debounce search (nếu có).

---

## 5. WEB — DASHBOARD TÍCH HỢP (làm sau backend §2)

### Task 5.1 — Tab "Dự án của tôi"
**Làm gì:** Sửa `app/dashboard/page.tsx` thêm tab `projects` + `ProjectsTab` (reuse TABS pattern). Gọi `GET /api/custom-projects/my`.
**Verify:**
- [CHẠY] Tab hiện; list dự án của user.
- [ỔN] Chưa login → redirect; user khác → 403.
- [TỐT] Style đồng bộ.
- [TỐI ƯU] Fetch lazy theo tab.

### Task 5.2 — Trang chi tiết + Timeline + Milestone
**Làm gì:** `app/dashboard/projects/[id]/page.tsx` + `components/dashboard/project-timeline.tsx` (pipeline 7 bước) + `project-milestones.tsx` (list + nút "Thanh toán" gọi `POST /milestones/:mid/pay-link` → redirect PayOS).
**Verify:**
- [CHẠY] Chi tiết render; bấm thanh toán → link PayOS.
- [ỔN] Milestone đã trả → disable nút; user khác → 403.
- [TỐT] UX tiếng Việt.
- [TỐI ƯU] Refetch sau thanh toán (webhook async).

### Task 5.3 — Message thread + Notification badge
**Làm gì:** `components/dashboard/project-message-thread.tsx` (GET/POST messages, load lại khi submit — KHÔNG realtime). Badge đếm `unreadCount` (từ `Notification` hoặc field `unreadUpdates`).
**Verify:**
- [CHẠY] Gửi message → hiện trong thread (reload); badge cập nhật.
- [ỔN] User khác → 403; empty state rõ.
- [TỐT] Tái dùng `.card`/`.badge`/`.input`.
- [TỐI ƯU] Không poll thừa (chỉ load khi submit/mở tab).

---

## 6. EMAIL TEMPLATES (reuse Resend)
**Làm gì:** Thêm vào `common/email/email.service.ts`: `sendCustomRequestNotify` (admin), `sendProjectUpdateEmail` (user khi đổi status), `sendMilestonePaidEmail` (user khi thu tiền). Template tiếng Việt (React Email).
**Verify:**
- [CHẠY] Gửi email test thành công.
- [ỔN] Lỗi email không crash flow chính (try/catch async).
- [TỐT] Template tiếng Việt chuẩn.
- [TỐI ƯU] Queue/gửi async.

---

## 7. TEST & COMMIT (cuối)

### Task 7.1 — Build & typecheck 3 app
**Làm gì:** `pnpm --filter api build && pnpm --filter web build && pnpm --filter admin build`.
**Verify:**
- [CHẠY] 3 app build xanh.
- [ỔN] Không ESLint nghiêm trọng.
- [TỐT] Commit tiếng Việt.
- [TỐI ƯU] Không code chết.

### Task 7.2 — Luồng e2e tay
**Làm gì:** Khách gửi `/bao-gia` → admin thấy Kanban NEW → quote → CONFIRMED → tạo milestone 30/40/30 → IN_PROGRESS → khách thanh toán milestone 1 (PayOS sandbox) → webhook PAID → REVIEW → DELIVERED (upload file v2) → WARRANTY → khách xem `/du-an` + dashboard tab.
**Verify:**
- [CHẠY] Toàn bộ luồng qua được.
- [ỔN] Edge: user bị khóa, milestone trùng, file lỗi.
- [TỐT] Ghi tài khoản test.
- [TỐI ƯU] Script `scripts/smoke-phase4.sh`.

### Task 7.3 — Commit tiếng Việt (theo nhóm)
- `feat(api): schema + migration phase4 (custom-project + milestone + message + file)`
- `feat(api): custom-projects module (request/project/milestone/message/file)`
- `feat(api): milestone payment PayOS + webhook + email`
- `feat(admin): kanban board custom-projects`
- `feat(web): form báo giá + portfolio`
- `feat(web): dashboard tích hợp dự án custom`
- `chore: docker/env phase4`

---

## CÁC ĐIỂM CẦN XÁC NHẬN — ✅ ĐÃ CHỐT (2026-07-16)

> Tất cả 10 điểm đã được user duyệt theo phương án đề xuất (A). Xem chi tiết ở mục **"QUYẾT ĐỊNH ĐÃ CHỐT"** đầu file. Tóm tắt:

| # | Điểm | Chốt |
|---|------|------|
| 1 | Milestone mặc định | ✅ 30% / 40% / 30% (auto-generate) |
| 2 | Hợp đồng | ✅ Checkbox xác nhận scope + `contractSignedAt` (không e-sign thật) |
| 3 | Bảo hành | ✅ 3 tháng |
| 4 | Trao đổi | ✅ Message load lại khi submit (không realtime) |
| 5 | Thông báo | ✅ Model `Notification` riêng + email |
| 6 | Form báo giá login | ✅ KHÔNG yêu cầu login |
| 7 | Portfolio | ✅ `CustomProject` DELIVERED + `isShowcase=true` |
| 8 | Route portfolio | ✅ `/du-an` |
| 9 | Model Payment | ✅ Tạo `Payment` riêng |
| 10 | Link thanh toán | ✅ Khách tự bấm trong dashboard |

**Trạng thái:** Mọi quyết định đã chốt đầy đủ. Plan sẵn sàng implement, **chờ user bật đèn xanh code**. Chưa code bất kỳ dòng nào.

---

## THỨ TỰ THỰC HIỆN (đề xuất)

```
Mục 1 (schema) → 2 (backend module) → 3 (admin kanban) // backend xong mới có UI data
Đồng thời: 4 (web form/portfolio) + 6 (email) chạy song song với 2
Sau 2+3: 5 (dashboard tích hợp)
Cuối: 7 (test/commit)
```
Mỗi mục xong chạy Verify 4 mức trước khi sang mục sau.

## ƯỚC TÍNH BƯỚC (tổng hợp)
- Schema + migration: ~1 ngày
- Backend custom-projects module: ~5-6 ngày (request, project, milestone, message, file, webhook, notification)
- Admin Kanban: ~8 bước (~3-4 ngày)
- Web form + portfolio: ~6-7 ngày (FE)
- Web dashboard tích hợp: ~6 bước (~3 ngày FE)
- Email: ~1 ngày
- Test + commit: ~2 ngày
**Tổng: ~4-5 tuần** (nằm trong khung Phase 4 tuần 14-16, có thể co giãn).

## Critical files
- `apps/api/prisma/schema.prisma` (5 model + 4 enum + Payment mở rộng; migration `phase4_custom_service`)
- `apps/api/src/custom-projects/*` (mới)
- `apps/api/src/payments/payments.service.ts` (mở rộng webhook + createPaymentLink)
- `apps/api/src/common/email/email.service.ts` (3 template mới)
- `apps/admin/src/pages/CustomProjects.tsx` + `components/kanban/*` (mới)
- `apps/admin/src/App.tsx`, `Layout.tsx`, `lib/rbac.ts` (thêm route/nav/guard)
- `apps/web/src/app/bao-gia/page.tsx`, `du-an/page.tsx`, `du-an/[slug]/page.tsx` (mới)
- `apps/web/src/app/dashboard/page.tsx` + `dashboard/projects/[id]/page.tsx` + `components/dashboard/project-*.tsx` (mới/sửa)
- `apps/web/src/components/header.tsx`, `lib/use-portfolio.ts`, `lib/use-quote.ts` (sửa/thêm)
