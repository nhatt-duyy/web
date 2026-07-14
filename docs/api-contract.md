# API Contract — Source Code Marketplace + Custom Dev

> **Phase 0 Deliverable** — OpenAPI 3.1 Specification (Summary)
> **Base URL**: `https://api.sourceban.dev/v1` (production) / `http://localhost:3001/v1` (dev)
> **Auth**: Bearer JWT (Access Token 15m, Refresh Token 7d HttpOnly Cookie)
> **Rate Limits**: Auth 5/min, License Activate 10/min, Download 20/min, General 100/min
> **Idempotency**: `Idempotency-Key` header for POST/PATCH (payments, orders, licenses)

---

## 1. Authentication & Authorization

### 1.1 Endpoints

| Method | Path | Description | Auth | Rate Limit |
|--------|------|-------------|------|------------|
| POST | `/auth/register` | Register new customer | None | 5/min |
| POST | `/auth/login` | Email/password login | None | 5/min |
| POST | `/auth/oauth/google` | Google OAuth callback | None | 10/min |
| POST | `/auth/oauth/github` | GitHub OAuth callback | None | 10/min |
| POST | `/auth/refresh` | Refresh access token | Refresh Cookie | 10/min |
| POST | `/auth/logout` | Revoke refresh token | Access Token | 10/min |
| POST | `/auth/forgot-password` | Request reset email | None | 3/hour |
| POST | `/auth/reset-password` | Reset with token | None | 5/hour |
| POST | `/auth/verify-email` | Verify email token | None | 5/hour |
| POST | `/auth/resend-verification` | Resend verification | Access Token | 3/hour |
| GET | `/auth/me` | Get current user profile | Access Token | 100/min |
| PATCH | `/auth/me` | Update profile | Access Token | 20/min |
| POST | `/auth/me/avatar` | Upload avatar (multipart) | Access Token | 5/min |
| POST | `/auth/change-password` | Change password | Access Token | 5/min |
| POST | `/auth/enable-2fa` | Enable 2FA (TOTP) | Access Token | 3/min |
| POST | `/auth/disable-2fa` | Disable 2FA | Access Token | 3/min |

### 1.2 Request/Response Examples

**POST /auth/register**
```json
// Request
{
  "email": "dev@example.com",
  "password": "SecurePass123!",
  "name": "Nguyen Van Dev",
  "acceptTerms": true
}

// Response 201
{
  "user": {
    "id": "cm7x9k2z0000abc123",
    "email": "dev@example.com",
    "name": "Nguyen Van Dev",
    "role": "CUSTOMER",
    "emailVerified": false,
    "createdAt": "2026-07-14T10:30:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "set in HttpOnly cookie"
}
```

**POST /auth/login**
```json
// Request
{
  "email": "dev@example.com",
  "password": "SecurePass123!",
  "rememberMe": true
}

// Response 200
{
  "user": { ... },
  "accessToken": "eyJ...",
  "refreshToken": "cookie"
}
```

**Error Response (401/422/429)**
```json
{
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Password must be at least 8 chars" }
  ],
  "error": "Unprocessable Entity"
}
```

---

## 2. Products (Public + Admin)

### 2.1 Public Endpoints

| Method | Path | Description | Query Params |
|--------|------|-------------|--------------|
| GET | `/products` | List products (filter, sort, paginate) | `page`, `limit`, `category`, `tech`, `minPrice`, `maxPrice`, `sort`, `search`, `status` |
| GET | `/products/featured` | Featured/best-seller products | `limit` |
| GET | `/products/categories` | Category tree | - |
| GET | `/products/tech-stacks` | All tech stacks | - |
| GET | `/products/:slug` | Product detail | - |
| GET | `/products/:slug/versions` | Version history | - |
| GET | `/products/:slug/reviews` | Paginated reviews | `page`, `limit`, `rating` |
| GET | `/products/:slug/related` | Related products | `limit` |

**GET /products — Query Params Detail**
```
page=1&limit=12&category=web&tech=nextjs,react&minPrice=0&maxPrice=5000000&sort=newest|popular|rating|price_asc|price_desc&search=keyword&status=published
```

**Response 200**
```json
{
  "data": [
    {
      "id": "cm7x9k2z0000abc123",
      "slug": "ecommerce-nextjs-nestjs",
      "name": "E-commerce Next.js + NestJS",
      "shortDesc": "Full-stack e-commerce boilerplate",
      "description": "...",
      "category": { "id": "...", "slug": "web", "name": "Web Applications" },
      "techStacks": [{ "id": "...", "name": "Next.js", "slug": "nextjs", "color": "#000000" }, ...],
      "thumbnailUrl": "https://r2.sourceban.dev/products/thumb_xyz.webp",
      "galleryUrls": ["..."],
      "demoUrl": "https://demo.sourceban.dev/ecommerce",
      "version": "2.1.0",
      "priceRegular": "2990000",
      "priceExtended": "9990000",
      "licenseTypes": [
        { "id": "...", "name": "Regular", "price": "2990000", "downloadLimit": 5, "domainLimit": 1, "supportMonths": 6 },
        { "id": "...", "name": "Extended", "price": "9990000", "downloadLimit": 20, "domainLimit": 5, "supportMonths": 12 }
      ],
      "ratingAvg": "4.8",
      "ratingCount": 127,
      "salesCount": 342,
      "status": "PUBLISHED",
      "publishedAt": "2026-01-15T00:00:00.000Z",
      "createdAt": "2026-01-10T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 45,
    "totalPages": 4,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "categories": [{ "id": "...", "name": "Web Applications", "count": 23 }],
    "techStacks": [{ "id": "...", "name": "Next.js", "count": 18 }],
    "priceRange": { "min": 0, "max": 15000000 }
  }
}
```

### 2.2 Admin Endpoints (Require Admin Role)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/products` | Create product |
| GET | `/admin/products` | List all (include drafts) |
| GET | `/admin/products/:id` | Get product admin view |
| PATCH | `/admin/products/:id` | Update product |
| DELETE | `/admin/products/:id` | Soft delete |
| POST | `/admin/products/:id/publish` | Publish |
| POST | `/admin/products/:id/archive` | Archive |
| POST | `/admin/products/bulk` | Bulk actions (publish, archive, delete) |
| POST | `/admin/products/:id/versions` | Add version |
| PATCH | `/admin/products/:id/versions/:versionId` | Update version |
| DELETE | `/admin/products/:id/versions/:versionId` | Delete version |
| POST | `/admin/products/:id/license-types` | Add license type |
| PATCH | `/admin/products/:id/license-types/:ltId` | Update license type |
| DELETE | `/admin/products/:id/license-types/:ltId` | Delete license type |

**POST /admin/products — Request**
```json
{
  "slug": "saas-starter-nextjs",
  "name": "SaaS Starter Kit Next.js",
  "shortDesc": "Production-ready SaaS boilerplate",
  "description": "<p>Rich text content...</p>",
  "categoryId": "cm7x9k2z0000cat123",
  "techStackIds": ["cm7x...nextjs", "cm7x...tailwind", "cm7x...prisma"],
  "thumbnailUrl": "https://r2.sourceban.dev/products/thumb_abc.webp",
  "galleryUrls": ["https://r2.sourceban.dev/products/gallery_1.webp", "..."],
  "demoUrl": "https://demo.sourceban.dev/saas-starter",
  "repoUrl": "https://github.com/sourceban/saas-starter",
  "version": "1.0.0",
  "changelog": "## 1.0.0\n- Initial release",
  "priceRegular": 1990000,
  "priceExtended": 5990000,
  "licenseTypes": [
    { "name": "Regular", "price": 1990000, "downloadLimit": 5, "domainLimit": 1, "supportMonths": 6 },
    { "name": "Extended", "price": 5990000, "downloadLimit": 20, "domainLimit": 5, "supportMonths": 12 }
  ],
  "status": "DRAFT",
  "seoTitle": "SaaS Starter Next.js - SourceBan",
  "seoDesc": "Mua SaaS Starter Kit Next.js production-ready..."
}
```

---

## 3. Cart & Checkout

### 3.1 Cart (Session-based for guests, User-based for logged in)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/cart` | Get current cart | Optional |
| POST | `/cart/items` | Add item to cart | Optional |
| PATCH | `/cart/items/:itemId` | Update quantity | Optional |
| DELETE | `/cart/items/:itemId` | Remove item | Optional |
| POST | `/cart/coupon` | Apply coupon | Optional |
| DELETE | `/cart/coupon` | Remove coupon | Optional |
| POST | `/cart/merge` | Merge guest cart on login | Access Token |

**POST /cart/items**
```json
// Request
{
  "productId": "cm7x9k2z0000abc123",
  "licenseTypeId": "cm7x9k2z0000lic123",
  "quantity": 1
}

// Response 200
{
  "id": "cm7x9k2z0000cart123",
  "items": [
    {
      "id": "cm7x9k2z0000item123",
      "productId": "cm7x9k2z0000abc123",
      "licenseTypeId": "cm7x9k2z0000lic123",
      "productName": "E-commerce Next.js + NestJS",
      "licenseName": "Regular",
      "price": "2990000",
      "quantity": 1,
      "subtotal": "2990000"
    }
  ],
  "subtotal": "2990000",
  "discount": "0",
  "tax": "0",
  "total": "2990000",
  "coupon": null,
  "itemCount": 1
}
```

### 3.2 Checkout & Orders

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/checkout` | Create order from cart | Optional |
| GET | `/orders` | List user orders | Access Token |
| GET | `/orders/:id` | Order detail | Access Token |
| GET | `/orders/:id/invoice` | Download invoice PDF | Access Token |

**POST /checkout**
```json
// Request
{
  "email": "guest@example.com",        // required if guest
  "name": "Guest Buyer",               // required if guest
  "phone": "+84901234567",
  "address": {
    "fullName": "Guest Buyer",
    "phone": "+84901234567",
    "addressLine1": "123 Le Loi",
    "city": "Ho Chi Minh",
    "postalCode": "700000",
    "country": "VN"
  },
  "paymentMethod": "PAYOS",            // STRIPE | PAYOS | BANK_TRANSFER
  "couponCode": "WELCOME10",           // optional
  "notes": "Giao hàng giờ hành chính"
}

// Response 201
{
  "order": {
    "id": "cm7x9k2z0000ord123",
    "code": "ORD-A1B2C3",
    "status": "PENDING",
    "total": "2691000",
    "currency": "VND",
    "expiresAt": "2026-07-14T11:30:00.000Z",
    "items": [...]
  },
  "payment": {
    "id": "cm7x9k2z0000pay123",
    "provider": "PAYOS",
    "providerRef": "123456789",
    "checkoutUrl": "https://pay.payos.vn/web/123456789",
    "qrCode": "data:image/png;base64,...",
    "deeplink": "payos://pay/123456789"
  }
}
```

---

## 4. Payments & Webhooks

### 4.1 Payment Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/payments/webhook/stripe` | Stripe webhook | Signature Verify |
| POST | `/payments/webhook/payos` | PayOS webhook | Signature Verify |
| GET | `/payments/:id/status` | Poll payment status | Access Token |
| POST | `/payments/:id/refund` | Initiate refund (admin) | Admin |

**PayOS Webhook Payload**
```json
{
  "code": "00",
  "desc": "Success",
  "data": {
    "orderCode": 123456789,
    "amount": 2691000,
    "description": "ORD-A1B2C3",
    "accountNumber": "1234567890",
    "reference": "cm7x9k2z0000pay123",
    "transactionDateTime": "2026-07-14T10:30:00+07:00",
    "currency": "VND",
    "paymentLinkId": "987654321",
    "status": "PAID",
    "checkoutUrl": "https://pay.payos.vn/web/123456789",
    "qrCode": "..."
  },
  "signature": "sha256_verified_signature"
}
```

---

## 5. Licenses & Downloads

### 5.1 Customer License Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/licenses` | List user licenses | Access Token |
| GET | `/licenses/:key` | License detail | Access Token |
| POST | `/licenses/:key/activate` | Activate license (bind domain/IP) | Access Token |
| POST | `/licenses/:key/deactivate` | Deactivate (release domain) | Access Token |
| POST | `/licenses/:key/download` | Generate signed download URL | Access Token |
| GET | `/licenses/:key/downloads` | Download history | Access Token |

**POST /licenses/:key/activate**
```json
// Request
{
  "domain": "myapp.com",
  "ip": "203.0.113.45"
}

// Response 200
{
  "license": {
    "key": "LIC-A1B2C3D4E5F6",
    "status": "ACTIVE",
    "activatedDomain": "myapp.com",
    "activatedIp": "203.0.113.45",
    "activatedAt": "2026-07-14T10:30:00.000Z",
    "expiresAt": "2027-01-14T10:30:00.000Z",
    "downloadCount": 0,
    "maxDownloads": 5
  },
  "downloadUrl": "https://r2.sourceban.dev/signed/abc123?Expires=...&Signature=...&KeyId=..."
}
```

**POST /licenses/:key/download**
```json
// Request (optional: specify version)
{
  "versionId": "cm7x9k2z0000ver123"
}

// Response 200
{
  "downloadUrl": "https://r2.sourceban.dev/signed/xyz789?Expires=...&Signature=...&KeyId=...",
  "expiresAt": "2026-07-14T10:45:00.000Z",
  "fileName": "ecommerce-nextjs-nestjs-v2.1.0.zip",
  "fileSize": 157286400,
  "version": "2.1.0",
  "remainingDownloads": 4
}
```

### 5.2 Admin License Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/licenses` | List all (filters) |
| GET | `/admin/licenses/:key` | Detail + activation log |
| POST | `/admin/licenses/:key/revoke` | Revoke license |
| POST | `/admin/licenses/:key/extend` | Extend support/expiry |
| POST | `/admin/licenses/:key/reset-downloads` | Reset download count |
| GET | `/admin/licenses/stats` | Aggregate stats |

---

## 6. Reviews

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/products/:slug/reviews` | Public list | Optional |
| POST | `/reviews` | Create review (verified purchase) | Access Token |
| PATCH | `/reviews/:id` | Update own review | Access Token |
| DELETE | `/reviews/:id` | Delete own review | Access Token |
| POST | `/reviews/:id/helpful` | Mark helpful | Access Token |
| GET | `/admin/reviews` | Admin list (moderate) | Admin |
| PATCH | `/admin/reviews/:id` | Approve/hide | Admin |

**POST /reviews**
```json
// Request
{
  "orderItemId": "cm7x9k2z0000item123",
  "rating": 5,
  "title": "Excellent boilerplate!",
  "content": "Saved me weeks of work. Clean code, great docs."
}

// Response 201
{
  "id": "cm7x9k2z0000rev123",
  "status": "PENDING",
  "createdAt": "2026-07-14T10:30:00.000Z"
}
```

---

## 7. Coupons

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/cart/coupon` | Validate & apply | Optional |
| DELETE | `/cart/coupon` | Remove | Optional |
| GET | `/admin/coupons` | List | Admin |
| POST | `/admin/coupons` | Create | Admin |
| PATCH | `/admin/coupons/:id` | Update | Admin |
| DELETE | `/admin/coupons/:id` | Delete | Admin |
| GET | `/admin/coupons/:id/usage` | Usage stats | Admin |

**POST /admin/coupons**
```json
{
  "code": "SUMMER2026",
  "type": "PERCENT",
  "value": 20,
  "minOrder": 500000,
  "maxDiscount": 500000,
  "usageLimit": 100,
  "perUserLimit": 1,
  "validFrom": "2026-06-01T00:00:00.000Z",
  "validTo": "2026-08-31T23:59:59.000Z",
  "stackable": false,
  "isActive": true
}
```

---

## 8. Customer Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard/stats` | Stats cards (orders, licenses, tickets, spent) |
| GET | `/dashboard/orders` | Paginated orders |
| GET | `/dashboard/licenses` | License grid |
| GET | `/dashboard/tickets` | Tickets list |
| GET | `/dashboard/profile` | Profile info |
| PATCH | `/dashboard/profile` | Update profile |
| POST | `/dashboard/addresses` | Add address |
| PATCH | `/dashboard/addresses/:id` | Update address |
| DELETE | `/dashboard/addresses/:id` | Delete address |
| GET | `/dashboard/referral` | Referral stats |

---

## 9. Tickets (Support)

### 9.1 Customer

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tickets` | List tickets (filter: status) |
| POST | `/tickets` | Create ticket |
| GET | `/tickets/:id` | Ticket detail + messages |
| POST | `/tickets/:id/messages` | Add message |
| POST | `/tickets/:id/reopen` | Reopen closed |
| POST | `/tickets/:id/rate` | Rate support (1-5) |

### 9.2 Admin

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/tickets` | Kanban/list view |
| GET | `/admin/tickets/:id` | Detail with internal notes |
| PATCH | `/admin/tickets/:id` | Update status, assignee, priority, tags |
| POST | `/admin/tickets/:id/messages` | Reply (public/internal) |
| POST | `/admin/tickets/:id/assign` | Assign to agent |
| GET | `/admin/tickets/stats` | SLA, volume, resolution time |

**POST /tickets**
```json
{
  "subject": "License activation failed",
  "category": "LICENSE",
  "priority": "HIGH",
  "content": "Tried activating on staging.domain.com but got error...",
  "fileUrls": ["https://r2.sourceban.dev/tickets/.../error.png"]
}
```

---

## 10. Custom Projects (Phase 4)

### 10.1 Customer

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/quote` | Submit quote request |
| GET | `/projects` | List own projects |
| GET | `/projects/:id` | Project detail |
| GET | `/projects/:id/milestones` | Milestones + payment status |
| POST | `/projects/:id/messages` | Send message |
| GET | `/projects/:id/files` | Project files |
| POST | `/projects/:id/files` | Upload file |

### 10.2 Admin

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/projects` | Kanban board (all projects) |
| GET | `/admin/projects/:id` | Project detail |
| PATCH | `/admin/projects/:id` | Update phase, assignee, priority |
| POST | `/admin/projects/:id/milestones` | Add milestone |
| PATCH | `/admin/projects/:id/milestones/:mId` | Update milestone |
| POST | `/admin/projects/:id/milestones/:mId/invoice` | Generate invoice |
| POST | `/admin/projects/:id/messages` | Internal/client message |
| POST | `/admin/projects/:id/handoff` | Create handoff (files, version) |
| POST | `/admin/projects/:id/warranty` | Start warranty period |

**POST /projects/quote**
```json
{
  "projectType": "WEB_APP",
  "title": "Hệ thống quản lý kho đa chi nhánh",
  "description": "Cần xây dựng hệ thống quản lý kho...",
  "budgetMin": 50000000,
  "budgetMax": 80000000,
  "deadline": "2026-10-15",
  "requirements": [
    "Quản lý nhập/xuất/kho",
    "Báo cáo tồn kho realtime",
    "Phân quyền đa cấp"
  ],
  "techPreference": "NEXTJS_NESTJS_POSTGRES",
  "attachments": ["https://r2.sourceban.dev/quotes/req_123.pdf"]
}
```

---

## 11. Admin - Users & CRM

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/users` | Paginated, filterable |
| GET | `/admin/users/:id` | Full profile + timeline |
| PATCH | `/admin/users/:id` | Update role, status, notes |
| POST | `/admin/users/:id/impersonate` | Generate impersonation token |
| GET | `/admin/users/:id/orders` | User orders |
| GET | `/admin/users/:id/licenses` | User licenses |
| GET | `/admin/users/:id/tickets` | User tickets |
| GET | `/admin/users/:id/projects` | User custom projects |
| POST | `/admin/users/:id/tags` | Add tag (VIP, HIGH_LTV, etc.) |
| DELETE | `/admin/users/:id/tags/:tag` | Remove tag |
| GET | `/admin/customers/segments` | Segment builder |
| POST | `/admin/customers/segments/export` | Export CSV for email marketing |

---

## 12. Admin - Content & Settings

### Content
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/admin/content/blog` | Blog posts |
| GET/PATCH/DELETE | `/admin/content/blog/:id` | CRUD post |
| GET/POST | `/admin/content/banners` | Homepage banners |
| GET/PATCH/DELETE | `/admin/content/banners/:id` | CRUD banner |
| GET/POST | `/admin/content/emails` | Email templates |
| POST | `/admin/content/emails/:id/test` | Send test email |

### Settings
| Method | Path | Description |
|--------|------|-------------|
| GET/PATCH | `/admin/settings/general` | Site config |
| GET/PATCH | `/admin/settings/payment` | Gateway keys, webhook URLs |
| GET/PATCH | `/admin/settings/email` | SMTP/Resend config |
| GET/PATCH | `/admin/settings/security` | Rate limits, CSP, 2FA policy |
| GET/PATCH | `/admin/settings/license` | Default limits, watermark key |
| GET/POST/PATCH/DELETE | `/admin/settings/roles` | RBAC matrix |

---

## 13. System & Monitoring

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/system/audit` | Audit logs (filterable) |
| GET | `/admin/system/webhooks` | Registered webhooks |
| POST | `/admin/system/webhooks` | Register webhook |
| GET | `/admin/system/webhooks/:id/deliveries` | Delivery attempts |
| POST | `/admin/system/webhooks/:id/retry` | Retry failed |
| GET | `/admin/system/backups` | Backup list |
| POST | `/admin/system/backups` | Trigger manual backup |
| GET | `/admin/system/health` | Service health checks |

---

## 14. Error Codes & Format

### Standard Error Response
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Email already registered" }
  ],
  "timestamp": "2026-07-14T10:30:00.000Z",
  "path": "/v1/auth/register",
  "requestId": "req_cm7x9k2z0000req123"
}
```

### Common HTTP Codes
| Code | Use Case |
|------|----------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Validation error |
| 401 | Unauthorized (token missing/invalid/expired) |
| 403 | Forbidden (insufficient role/permission) |
| 404 | Not found |
| 409 | Conflict (duplicate, state mismatch) |
| 422 | Unprocessable (business rule violation) |
| 429 | Rate limited |
| 500 | Internal server error |
| 503 | Service unavailable (maintenance) |

### Business Error Codes (in `errors[].code`)
| Code | HTTP | Message |
|------|------|---------|
| `LICENSE_ALREADY_ACTIVATED` | 409 | License already bound to another domain |
| `LICENSE_DOWNLOAD_LIMIT_EXCEEDED` | 422 | Maximum downloads reached |
| `LICENSE_EXPIRED` | 422 | Support period ended |
| `ORDER_NOT_PAID` | 409 | Cannot download from unpaid order |
| `COUPON_EXPIRED` | 422 | Coupon no longer valid |
| `COUPON_USAGE_LIMIT_EXCEEDED` | 422 | Coupon usage limit reached |
| `PRODUCT_NOT_PUBLISHED` | 404 | Product not available for purchase |
| `PAYMENT_VERIFICATION_FAILED` | 400 | Webhook signature invalid |
| `INSUFFICIENT_STOCK` | 409 | Digital product - shouldn't happen |
| `PROJECT_PHASE_TRANSITION_INVALID` | 422 | Cannot move from X to Y directly |

---

## 15. Pagination & Filtering Standards

### Pagination (Cursor-based for large datasets, Offset for admin)
```json
// Offset (default)
{
  "page": 1,
  "limit": 20,
  "total": 450,
  "totalPages": 23
}

// Cursor (for public feeds)
{
  "cursor": "cm7x9k2z0000abc123",
  "limit": 20,
  "hasNext": true,
  "nextCursor": "cm7x9k2z0000def456"
}
```

### Filtering Pattern
```
?filter[field]=value                    // exact
?filter[field][$in]=a,b,c               // in array
?filter[field][$gte]=100                // gte/lte/gt/lt
?filter[field][$contains]=keyword       // ILIKE
?filter[field][$null]=true              // is null
?sort=createdAt:desc,price:asc          // multi-sort
```

---

## 16. Webhook Events (Outbound)

| Event | Payload Key | Description |
|-------|-------------|-------------|
| `order.created` | `order` | New order placed |
| `order.paid` | `order`, `payment` | Payment confirmed |
| `order.refunded` | `order`, `refund` | Refund processed |
| `license.activated` | `license`, `product` | Domain bound |
| `license.revoked` | `license`, `reason` | Admin revoked |
| `license.download` | `license`, `version` | File downloaded |
| `ticket.created` | `ticket` | New support ticket |
| `ticket.replied` | `ticket`, `message` | New message |
| `project.phase_changed` | `project`, `oldPhase`, `newPhase` | Kanban move |
| `project.milestone_paid` | `project`, `milestone`, `payment` | Milestone paid |
| `user.registered` | `user` | New customer |

**Webhook Delivery**: POST JSON, retry 3x (exponential backoff), timeout 10s, verify `X-Signature` (HMAC-SHA256)

---

## 17. OpenAPI Document

Full OpenAPI 3.1 spec available at:
- Dev: `http://localhost:3001/api/docs` (Scalar UI)
- Prod: `https://api.sourceban.dev/api/docs`

Generated from NestJS decorators (`@nestjs/swagger`) + Zod schemas.

---

## 18. Versioning & Deprecation

- URL versioning: `/v1/`, `/v2/`
- Header: `Accept: application/vnd.sourceban.v1+json`
- Deprecation notice: `Sunset` header + 90 days notice
- Breaking changes only in major version

---

## 19. Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Backend Lead | | | |
| Frontend Lead | | | |
| QA Lead | | | |

> **Next**: `docs/security-plan.md` — Security hardening, license protection, watermarking