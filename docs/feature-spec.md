# Feature Specification — Source Code Marketplace + Custom Dev

> **Phase 0 Deliverable** — Dựa trên `docs/ke-hoach-website-ban-source-code.md` & `docs/ke-hoach-chi-tiet-theo-phase.md`
> **Phương pháp**: MoSCoW (Must/Should/Could/Won't)
> **Phạm vi**: Phase 1-4 (MVP → Launch), Phase 5-8 ghi chú để sau

---

## 1. MoSCoW Overview

| Priority | Phases | Mô Tả |
|----------|--------|-------|
| **Must Have** | Phase 1-3 | Core marketplace: browse, buy, download, admin management, payments |
| **Should Have** | Phase 2-3 | Reviews, multi-license, coupons, customer dashboard, basic CRM |
| **Could Have** | Phase 3-4 | Advanced admin (Kanban custom, milestones, helpdesk), affiliate |
| **Won't Have (v1)** | Phase 8+ | Multi-seller marketplace, multi-lang/currency, AI recommendations, mobile app |

---

## 2. Must Have (Phase 1-3) — Core MVP

### 2.1 Customer Frontend (Next.js)

| ID | Feature | User Story | Acceptance Criteria | Phase |
|----|---------|------------|---------------------|-------|
| F-01 | Trang chủ | Khách thấy hero, sản phẩm nổi bật, số liệu uy tín, CTA | Load < 2s, SSR, SEO meta đầy đủ | 1 |
| F-02 | Danh sách sản phẩm | Khách lọc theo category, tech stack, giá, rating; tìm kiếm; phân trang | Filter real-time, URL sync, infinite scroll/pagination | 1 |
| F-03 | Chi tiết sản phẩm | Xem gallery, mô tả, tech stack, changelog, giá license, demo link | Mọi tab hiển thị đúng, CTA mua rõ ràng | 1 |
| F-04 | Giỏ hàng | Thêm/xóa sản phẩm, cập nhật số lượng, áp dụng coupon | Persist localStorage + sync server khi login | 1 |
| F-05 | Thanh toán | Chọn license, điền thông tin, thanh toán Stripe/PayOS | Tạo order → redirect payment → webhook confirm → email | 1 |
| F-06 | Xác thực | Đăng ký/đăng nhập email + password, Google OAuth, quên mật khẩu, verify email | JWT access + refresh token, protected routes | 1 |
| F-07 | Dashboard khách | Lịch sử đơn, tải lại file (giới hạn lần), license key, ticket hỗ trợ | Download countdown, license copyable, ticket CRUD | 2 |
| F-08 | Review/Rating | Chỉ người mua mới review, rating 1-5, comment, admin duyệt | Hiển thị trung bình, phân bố sao, admin approve/hide | 2 |
| F-09 | Coupon | Mã giảm giá %/cố định, hạn sử dụng, giới hạn lần dùng/người | Validate real-time tại cart/checkout | 2 |

### 2.2 Admin Panel (React SPA)

| ID | Feature | User Story | Acceptance Criteria | Phase |
|----|---------|------------|---------------------|-------|
| A-01 | Dashboard tổng quan | KPI: doanh thu, đơn mới, chuyển đổi, top sản phẩm | Biểu đồ Recharts, real-time via SWR polling | 3 |
| A-02 | CRUD sản phẩm | Thêm/sửa/xóa SP, upload file source (R2), ảnh, video, version, changelog | Drag-drop upload, progress bar, preview trước publish | 1 |
| A-03 | Quản lý đơn hàng | Xem danh sách, filter trạng thái, cập nhật thủ công, xuất Excel | Pagination, bulk actions, webhook sync status | 1 |
| A-04 | Phân quyền (RBAC) | Super Admin, Sales, Developer, Support, Content | Matrix granular per module/action, middleware guard | 3 |
| A-05 | CRM cơ bản | Hồ sơ khách: LTV, lịch sử mua, tag VIP, ghi chú nội bộ, segment | Tìm kiếm fuzzy, export segment cho email marketing | 3 |
| A-06 | CMS nội dung | Blog, banner homepage, email template | Rich text editor (TipTap), preview, schedule publish | 3 |

### 2.3 Backend API (NestJS)

| ID | Module | Endpoints Chính | Business Logic | Phase |
|----|--------|-----------------|----------------|-------|
| B-01 | Auth | POST /auth/register, /login, /refresh, /forgot, /reset, /verify, /oauth/google | JWT (15m access, 7d refresh), bcrypt, rate-limit login | 1 |
| B-02 | Users | GET /users/me, PATCH /users/me, GET /users/:id (admin) | Profile, avatar (R2), role assignment | 1 |
| B-03 | Products | CRUD /products, GET /products (filter, search, paginate), GET /products/:slug | Versioning, license types, file encryption refs | 1 |
| B-04 | Orders | POST /orders, GET /orders, GET /orders/:id, PATCH /orders/:id (admin) | Cart → Order pending → Payment webhook → Paid → Fulfillment | 1 |
| B-05 | Payments | POST /payments/create-intent (Stripe/PayOS), POST /payments/webhook | Idempotency key, signature verify, order status sync | 1 |
| B-06 | Licenses | POST /licenses/activate, GET /licenses/:key, POST /licenses/:key/download | Domain/IP binding, download limit, signed URL (R2, 15m TTL) | 1-2 |
| B-07 | Reviews | POST /reviews, GET /reviews/product/:id, PATCH /reviews/:id (admin) | Verified purchase only, admin moderate | 2 |
| B-08 | Coupons | CRUD /coupons, POST /coupons/validate | Type: percent/fixed, usage limits, expiry, stackable flag | 2 |
| B-09 | Tickets | CRUD /tickets, POST /tickets/:id/messages, PATCH /tickets/:id/status | SLA tracking, assignee, priority, email notify | 3 |
| B-10 | Custom Projects | CRUD /projects, Kanban transitions, milestones, payments per milestone | Phase 4 detail | 4 |

---

## 3. Should Have (Phase 2-3) — Enhanced UX

| ID | Feature | Mô Tả | Phase |
|----|---------|-------|-------|
| S-01 | Full-text search | MeiliSearch: typo-tolerance, filter facets (price, tech, rating), synonym mapping | 2 |
| S-02 | Related products | Algorithm: same category + tech tags + collaborative filtering đơn giản | 2 |
| S-03 | Flash sale / countdown timer | Scheduled price override, FE countdown, badge "Flash Sale" | 2 |
| S-04 | Affiliate basics | Referral link, cookie 30 ngày, commission % cố định, dashboard partner | 3 |
| S-05 | Email marketing automation | Abandoned cart (1h, 24h), post-purchase review request, license expiry reminder | 3 |
| S-06 | Invoice PDF auto-generate | Puppeteer/PDFKit template, attach email, download admin/customer | 3 |

---

## 4. Could Have (Phase 3-4) — Ops Efficiency

| ID | Feature | Mô Tả | Phase |
|----|---------|-------|-------|
| C-01 | Kanban Custom Projects | Drag-drop columns: Quote → Pricing → Signed → Dev → Review → Handoff → Warranty | 4 |
| C-02 | Milestone payments | Deposit 30% → Mid 40% → Final 30%, auto-invoice, payment tracking per project | 4 |
| C-03 | Helpdesk SLA | Priority matrix (Critical/High/Medium/Low), auto-escalate, response/resolution timer | 3 |
| C-04 | Audit log | Immutable log: user actions (login, order, download, license activate, admin changes) | 3 |
| C-05 | Webhooks outbound | Order.paid, License.activated, Project.milestone_paid — cho partner integration | 4 |

---

## 5. Won't Have (Phase 8+) — Future Scale

| ID | Feature | Lý Do Defer |
|----|---------|-------------|
| W-01 | Multi-seller marketplace | Cần KYC, payout split, dispute resolution — phức tạp pháp lý |
| W-02 | Multi-language / Multi-currency | i18n routing, exchange rate service, localized payment — Phase 8 |
| W-03 | AI code review / recommendation | Cần data volume đủ lớn, ROI chưa rõ |
| W-04 | Mobile app (React Native) | PWA đủ cho MVP, native app sau khi có user base |
| W-05 | Subscription maintenance packages | Recurring billing logic, Stripe Billing, dunning management — Phase 8 |

---

## 6. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | LCP (Largest Contentful Paint) homepage | < 2.5s (SSR + CDN) |
| | API p95 latency (read) | < 200ms |
| | API p95 latency (write/payment) | < 500ms |
| **Scalability** | Concurrent users (Phase 1) | 500 |
| | Concurrent users (Phase 3) | 5,000 |
| | Database connection pool | PgBouncer 100-200 |
| **Availability** | Uptime SLA | 99.9% (monthly) |
| | Backup RPO/RTO | RPO 1h / RTO 4h |
| **Security** | OWASP Top 10 compliance | Pass |
| | License key brute-force protection | Rate limit 5 req/min/IP |
| | File download signed URL expiry | 15 minutes |
| | Watermark detection accuracy | > 95% on leaked sample |
| **Accessibility** | WCAG 2.1 AA | Pass axe-core audit |
| **SEO** | Core Web Vitals | Green |
| | Structured data (Product, Review, Breadcrumb) | Valid |

---

## 7. Data Entities Summary (for ERD)

```
User
  - id, email, passwordHash, name, avatarUrl, role, emailVerified, createdAt
  - relations: orders, licenses, tickets, projects, reviews, addresses

Product
  - id, slug, name, description, shortDesc, categoryId, techStack[], priceRegular, priceExtended
  - version, changelog, demoUrl, repoUrl, thumbnailUrl, galleryUrls[], status (draft/published/archived)
  - relations: categories, licenses, orders, reviews, versions

Category
  - id, slug, name, description, parentId (hierarchy), order

LicenseType
  - id, productId, name (Regular/Extended), price, description, downloadLimit, domainLimit, supportMonths

Order
  - id, userId, code, status (pending/paid/failed/refunded/expired), subtotal, discount, tax, total
  - paymentIntentId, paymentMethod, paidAt, expiresAt
  - relations: items, coupons, user

OrderItem
  - id, orderId, productId, licenseTypeId, price, licenseKey (generated on paid)

License
  - id, key (uuid), orderItemId, userId, productId, licenseTypeId
  - status (active/revoked/expired), activatedDomain?, activatedIp?, downloadCount, maxDownloads
  - activatedAt, expiresAt (support period), createdAt

Coupon
  - id, code, type (percent/fixed), value, minOrder, maxDiscount, usageLimit, usedCount
  - validFrom, validTo, stackable, status

Review
  - id, productId, userId, orderItemId, rating, comment, status (pending/approved/hidden), createdAt

Ticket
  - id, userId, subject, status (open/in_progress/waiting_customer/closed), priority
  - assigneeId, projectId?, createdAt, updatedAt, closedAt
  - relations: messages

TicketMessage
  - id, ticketId, userId, content, isInternal, createdAt

Project (Custom Dev)
  - id, userId, code, title, description, budgetMin, budgetMax, deadline, status
  - currentPhase (quote/pricing/signed/dev/review/handoff/warranty)
  - relations: milestones, messages, files, payments

ProjectMilestone
  - id, projectId, name, amount, dueDate, status (pending/paid/overdue), paidAt

ProjectMessage
  - id, projectId, userId, content, fileUrls[], isInternal, createdAt

AuditLog
  - id, userId, action, entityType, entityId, oldData, newData, ip, userAgent, createdAt
```

---

## 8. Phase Gate Criteria (Definition of Done per Phase)

| Phase | Gate Criteria (All Must Pass) |
|-------|-------------------------------|
| **0** | Feature Spec approved, ERD reviewed, Wireframes signed off, API Contract v1 documented, Security Plan approved, Repo + CI green |
| **1** | E2E: Guest → Register → Browse → Cart → Pay (Stripe/PayOS) → Webhook → Order Paid → License Generated → Download File → Email Sent. Admin: CRUD Product, View Orders. Unit test coverage > 60% core modules. |
| **2** | Search works (MeiliSearch), Reviews CRUD + moderation, Coupons validate, Customer Dashboard: download history + license mgmt + tickets. Load test 200 concurrent. |
| **3** | Admin: KPI dashboard, RBAC matrix enforced, CRM segment export, CMS blog/banner, Helpdesk SLA. Audit log immutable. |
| **4** | Custom Project: Quote form → Kanban → Milestone payments → Handoff file upload → Warranty ticket separate. Email notifications each transition. |
| **5** | License activation binds domain/IP, download limit enforced, watermark injected in source zip, suspicious download alert (Slack/email), OWASP scan pass. |
| **6** | Unit > 70%, Integration E2E critical paths, Lighthouse > 90, axe-core 0 violations, k6 load test 1000 VU passes. |
| **7** | Production deploy, SSL, monitoring alerts, 10-20 seeded quality products, payment live test, 48h hypercare. |

---

## 9. Assumptions & Constraints

| # | Assumption | Risk if Wrong |
|---|------------|---------------|
| 1 | Solo dev → sequental phases, no parallel FE/BE | Timeline extends if scope creep |
| 2 | PayOS sandbox → production switch seamless | VN payment KYC may take 1-2 weeks |
| 3 | Cloudflare R2 free tier sufficient for Phase 1-3 | Cost scales with file size/downloads |
| 4 | MeiliSearch single node enough < 10k products | Need cluster if > 50k products |
| 5 | NextAuth.js v5 stable enough (currently beta/RC) | May need migration if breaking changes |
| 6 | Vietnam tax/invoice compliance handled by admin manual export initially | Auto e-invoice integration Phase 8 |

---

## 10. Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| Designer | | | |

> **Next**: Tạo `docs/erd.md` (Mermaid ERD + Prisma schema draft)