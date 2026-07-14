# Database ERD & Prisma Schema — Source Code Marketplace

> **Phase 0 Deliverable** — Entity Relationship Diagram + Prisma Schema Draft
> **DB**: PostgreSQL 16 + Prisma ORM
> **Naming**: snake_case tables, camelCase fields in Prisma, UUID PKs (cuid)

---

## 1. Mermaid ERD

```mermaid
erDiagram
    %% Core User & Auth
    User ||--o{ Order : places
    User ||--o{ License : owns
    User ||--o{ Review : writes
    User ||--o{ Ticket : creates
    User ||--o{ TicketMessage : sends
    User ||--o{ Project : requests
    User ||--o{ ProjectMessage : sends
    User ||--o{ Address : has
    User ||--o{ AuditLog : performs

    %% Product Catalog
    Category ||--o{ Product : contains
    Category ||--o{ Category : "parent"
    Product ||--o{ ProductVersion : versions
    Product ||--o{ LicenseType : "license options"
    Product ||--o{ OrderItem : "ordered as"
    Product ||--o{ Review : receives
    Product ||--o{ ProductTechStack : "has tech"
    TechStack ||--o{ ProductTechStack : "used in"

    %% Orders & Payments
    Order ||--o{ OrderItem : contains
    Order ||--o{ CouponUsage : uses
    Order ||--o{ Payment : "paid via"
    OrderItem ||--|| License : generates
    LicenseType ||--o{ OrderItem : "selected"
    LicenseType ||--o{ License : defines

    %% Licenses & Downloads
    License ||--o{ DownloadLog : tracks

    %% Custom Projects
    Project ||--o{ ProjectMilestone : "has milestones"
    Project ||--o{ ProjectMessage : "has messages"
    Project ||--o{ ProjectFile : "has files"
    Project ||--o{ Payment : "milestone payments"
    ProjectMilestone ||--o{ Payment : "paid by"

    %% Support
    Ticket ||--o{ TicketMessage : contains
    User ||--o{ Ticket : assigns (support)

    %% Content & Marketing
    BlogPost ||--o{ BlogPostCategory : categorized
    Category ||--o{ BlogPostCategory : "blogs"
    Coupon ||--o{ CouponUsage : tracked

    %% System
    Setting }|--|| SystemConfig : singleton
```

---

## 2. Prisma Schema Draft

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum UserRole {
  SUPER_ADMIN
  ADMIN
  SALES
  DEVELOPER
  SUPPORT
  CONTENT
  CUSTOMER
}

enum OrderStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
  EXPIRED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
}

enum PaymentMethod {
  STRIPE
  PAYOS
  BANK_TRANSFER
  MANUAL
}

enum LicenseStatus {
  ACTIVE
  REVOKED
  EXPIRED
  PENDING_ACTIVATION
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  WAITING_CUSTOMER
  CLOSED
  REOPENED
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum ProjectStatus {
  QUOTE_REQUESTED
  QUOTING
  PRICED
  CONTRACT_SIGNED
  IN_DEVELOPMENT
  IN_REVIEW
  HANDOVER
  WARRANTY
  COMPLETED
  CANCELLED
}

enum ProjectPhase {
  QUOTE
  PRICING
  SIGNED
  DEV
  REVIEW
  HANDOVER
  WARRANTY
}

enum CouponType {
  PERCENT
  FIXED
}

enum ReviewStatus {
  PENDING
  APPROVED
  HIDDEN
}

enum ProductStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  DEPRECATED
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  DOWNLOAD
  ACTIVATE_LICENSE
  PAYMENT
  REFUND
  ROLE_CHANGE
}

// ============================================
// CORE MODELS
// ============================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?   @map("password_hash")
  name          String?
  avatarUrl     String?   @map("avatar_url")
  role          UserRole  @default(CUSTOMER)
  emailVerified Boolean   @default(false) @map("email_verified")
  emailVerifyToken String? @unique @map("email_verify_token")
  passwordResetToken String? @unique @map("password_reset_token")
  passwordResetExpires DateTime? @map("password_reset_expires")
  lastLoginAt   DateTime? @map("last_login_at")
  failedLoginAttempts Int @default(0) @map("failed_login_attempts")
  lockedUntil   DateTime? @map("locked_until")
  twoFactorEnabled Boolean @default(false) @map("two_factor_enabled")
  twoFactorSecret String? @map("two_factor_secret")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  // Relations
  orders        Order[]
  licenses      License[]
  reviews       Review[]
  tickets       Ticket[]          @relation("TicketCreator")
  assignedTickets Ticket[]        @relation("TicketAssignee")
  ticketMessages TicketMessage[]
  projects      Project[]         @relation("ProjectClient")
  projectMessages ProjectMessage[]
  addresses     Address[]
  auditLogs     AuditLog[]
  couponUsages  CouponUsage[]
  payments      Payment[]         @relation("PaymentUser")
  sessions      Session[]

  @@index([email])
  @@index([role])
  @@map("users")
}

model Session {
  id           String   @id @default(cuid())
  userId       String   @map("user_id")
  token        String   @unique
  expiresAt    DateTime @map("expires_at")
  ipAddress    String?  @map("ip_address")
  userAgent    String?  @map("user_agent")
  createdAt    DateTime @default(now()) @map("created_at")

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("sessions")
}

model Address {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  type        String   // billing, shipping
  fullName    String   @map("full_name")
  phone       String
  addressLine1 String  @map("address_line1")
  addressLine2 String? @map("address_line2")
  city        String
  state       String?
  postalCode  String   @map("postal_code")
  country     String   @default("VN")
  isDefault   Boolean  @default(false) @map("is_default")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("addresses")
}

// ============================================
// PRODUCT CATALOG
// ============================================

model Category {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String?
  parentId    String?  @map("parent_id")
  order       Int      @default(0)
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]
  blogPosts   BlogPostCategory[]

  @@index([parentId])
  @@index([slug])
  @@map("categories")
}

model TechStack {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  iconUrl   String?  @map("icon_url")
  color     String?  // hex for UI badge
  createdAt DateTime @default(now()) @map("created_at")

  products  ProductTechStack[]
  @@map("tech_stacks")
}

model Product {
  id              String        @id @default(cuid())
  slug            String        @unique
  name            String
  shortDesc       String?       @map("short_desc")
  description     String        @db.Text
  categoryId      String        @map("category_id")
  status          ProductStatus @default(DRAFT)
  version         String        @default("1.0.0")
  changelog       String?       @db.Text
  demoUrl         String?       @map("demo_url")
  repoUrl         String?       @map("repo_url")
  thumbnailUrl    String?       @map("thumbnail_url")
  galleryUrls     String[]      @map("gallery_urls")
  priceRegular    Decimal       @db.Decimal(12, 2) @map("price_regular")
  priceExtended   Decimal?      @db.Decimal(12, 2) @map("price_extended")
  salesCount      Int           @default(0) @map("sales_count")
  viewCount       Int           @default(0) @map("view_count")
  ratingAvg       Decimal?      @db.Decimal(3, 2) @map("rating_avg")
  ratingCount     Int           @default(0) @map("rating_count")
  publishedAt     DateTime?     @map("published_at")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")
  deletedAt       DateTime?     @map("deleted_at")

  // Relations
  category        Category          @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  licenseTypes    LicenseType[]
  versions        ProductVersion[]
  orderItems      OrderItem[]
  reviews         Review[]
  techStacks      ProductTechStack[]
  files           ProductFile[]

  @@index([categoryId, status])
  @@index([slug])
  @@index([status, publishedAt])
  @@map("products")
}

model ProductVersion {
  id          String   @id @default(cuid())
  productId   String   @map("product_id")
  version     String
  changelog   String?  @db.Text
  fileUrl     String   @map("file_url") // R2 encrypted path
  fileSize    BigInt   @map("file_size")
  fileHash    String   @map("file_hash") // SHA256 for integrity
  isLatest    Boolean  @default(false) @map("is_latest")
  releasedAt  DateTime @map("released_at")
  createdAt   DateTime @default(now()) @map("created_at")

  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([productId, version])
  @@index([productId, isLatest])
  @@map("product_versions")
}

model ProductFile {
  id          String   @id @default(cuid())
  productId   String   @map("product_id")
  type        String   // source, doc, asset, preview
  name        String
  url         String   // R2 path
  size        BigInt
  mimeType    String   @map("mime_type")
  order       Int      @default(0)
  createdAt   DateTime @default(now()) @map("created_at")

  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId, type])
  @@map("product_files")
}

model ProductTechStack {
  productId   String   @map("product_id")
  techStackId String   @map("tech_stack_id")

  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  techStack   TechStack @relation(fields: [techStackId], references: [id], onDelete: Cascade)

  @@id([productId, techStackId])
  @@map("product_tech_stacks")
}

model LicenseType {
  id              String   @id @default(cuid())
  productId       String   @map("product_id")
  name            String   // Regular, Extended
  description     String?  @db.Text
  price           Decimal  @db.Decimal(12, 2)
  downloadLimit   Int      @default(5) @map("download_limit")
  domainLimit     Int      @default(1) @map("domain_limit")
  supportMonths   Int      @default(6) @map("support_months")
  canModify       Boolean  @default(true) @map("can_modify")
  canRedistribute Boolean  @default(false) @map("can_redistribute")
  canCommercial   Boolean  @default(true) @map("can_commercial")
  isActive        Boolean  @default(true) @map("is_active")
  sortOrder       Int      @default(0) @map("sort_order")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  product         Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  orderItems      OrderItem[]
  licenses        License[]

  @@index([productId])
  @@map("license_types")
}

// ============================================
// ORDERS & PAYMENTS
// ============================================

model Order {
  id              String       @id @default(cuid())
  code            String       @unique @default(cuid()) // human-readable: ORD-XXXXXX
  userId          String       @map("user_id")
  status          OrderStatus  @default(PENDING)
  subtotal        Decimal      @db.Decimal(12, 2)
  discountAmount  Decimal      @default(0) @db.Decimal(12, 2) @map("discount_amount")
  taxAmount       Decimal      @default(0) @db.Decimal(12, 2) @map("tax_amount")
  total           Decimal      @db.Decimal(12, 2)
  currency        String       @default("VND")
  notes           String?
  paidAt          DateTime?    @map("paid_at")
  expiresAt       DateTime?    @map("expires_at") // for pending orders
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")
  deletedAt       DateTime?    @map("deleted_at")

  user            User         @relation(fields: [userId], references: [id], onDelete: Restrict)
  items           OrderItem[]
  coupons         CouponUsage[]
  payments        Payment[]
  licenses        License[]    // generated on paid

  @@index([userId, status])
  @@index([status, createdAt])
  @@index([code])
  @@map("orders")
}

model OrderItem {
  id              String      @id @default(cuid())
  orderId         String      @map("order_id")
  productId       String      @map("product_id")
  licenseTypeId   String      @map("license_type_id")
  productName     String      @map("product_name") // snapshot
  licenseName     String      @map("license_name") // snapshot
  price           Decimal     @db.Decimal(12, 2)
  quantity        Int         @default(1)
  licenseKey      String?     @unique @map("license_key") // generated on paid

  order           Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product         Product     @relation(fields: [productId], references: [id], onDelete: Restrict)
  licenseType     LicenseType @relation(fields: [licenseTypeId], references: [id], onDelete: Restrict)
  license         License?

  @@index([orderId])
  @@index([licenseKey])
  @@map("order_items")
}

model Payment {
  id              String         @id @default(cuid())
  orderId         String?        @map("order_id")
  userId          String         @map("user_id")
  projectId       String?        @map("project_id") // for custom project milestones
  milestoneId     String?        @map("milestone_id")
  provider        PaymentMethod
  providerRef     String?        @map("provider_ref") // Stripe PI ID, PayOS order code
  amount          Decimal        @db.Decimal(12, 2)
  currency        String         @default("VND")
  status          PaymentStatus  @default(PENDING)
  metadata        Json?          // raw webhook payload
  paidAt          DateTime?      @map("paid_at")
  refundedAt      DateTime?      @map("refunded_at")
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  order           Order?         @relation(fields: [orderId], references: [id], onDelete: SetNull)
  user            User           @relation("PaymentUser", fields: [userId], references: [id], onDelete: Restrict)
  project         Project?       @relation(fields: [projectId], references: [id], onDelete: SetNull)
  milestone       ProjectMilestone? @relation(fields: [milestoneId], references: [id], onDelete: SetNull)

  @@index([orderId])
  @@index([projectId])
  @@index([provider, providerRef])
  @@index([status, createdAt])
  @@map("payments")
}

model Coupon {
  id            String      @id @default(cuid())
  code          String      @unique
  type          CouponType
  value         Decimal     @db.Decimal(12, 2) // percent or fixed amount
  minOrder      Decimal?    @db.Decimal(12, 2) @map("min_order")
  maxDiscount   Decimal?    @db.Decimal(12, 2) @map("max_discount")
  usageLimit    Int?        @map("usage_limit") // null = unlimited
  usedCount     Int         @default(0) @map("used_count")
  perUserLimit  Int         @default(1) @map("per_user_limit")
  validFrom     DateTime    @map("valid_from")
  validTo       DateTime    @map("valid_to")
  stackable     Boolean     @default(false)
  isActive      Boolean     @default(true) @map("is_active")
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")

  usages        CouponUsage[]

  @@index([code])
  @@index([validFrom, validTo, isActive])
  @@map("coupons")
}

model CouponUsage {
  id        String   @id @default(cuid())
  couponId  String   @map("coupon_id")
  orderId   String   @map("order_id")
  userId    String   @map("user_id")
  discount  Decimal  @db.Decimal(12, 2)
  createdAt DateTime @default(now()) @map("created_at")

  coupon    Coupon   @relation(fields: [couponId], references: [id], onDelete: Cascade)
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@unique([couponId, orderId])
  @@index([userId])
  @@map("coupon_usages")
}

// ============================================
// LICENSES & DOWNLOADS
// ============================================

model License {
  id              String        @id @default(cuid())
  key             String        @unique @default(cuid()) // LIC-XXXXXX
  orderItemId     String        @unique @map("order_item_id")
  userId          String        @map("user_id")
  productId       String        @map("product_id")
  licenseTypeId   String        @map("license_type_id")
  status          LicenseStatus @default(PENDING_ACTIVATION)
  activatedDomain String?       @map("activated_domain")
  activatedIp     String?       @map("activated_ip")
  downloadCount   Int           @default(0) @map("download_count")
  maxDownloads    Int           @map("max_downloads")
  activatedAt     DateTime?     @map("activated_at")
  expiresAt       DateTime?     @map("expires_at") // support expiry
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")
  revokedAt       DateTime?     @map("revoked_at")
  revokeReason    String?       @map("revoke_reason")

  orderItem       OrderItem     @relation(fields: [orderItemId], references: [id], onDelete: Cascade)
  user            User          @relation(fields: [userId], references: [id], onDelete: Restrict)
  product         Product       @relation(fields: [productId], references: [id], onDelete: Restrict)
  licenseType     LicenseType   @relation(fields: [licenseTypeId], references: [id], onDelete: Restrict)
  downloads       DownloadLog[]

  @@index([userId, status])
  @@index([productId, status])
  @@index([key])
  @@map("licenses")
}

model DownloadLog {
  id          String   @id @default(cuid())
  licenseId   String   @map("license_id")
  UserId      String?  @map("user_id")
  ipAddress   String   @map("ip_address")
  userAgent   String?  @map("user_agent")
  fileUrl     String   @map("file_url") // signed R2 URL
  fileVersion String   @map("file_version")
  success     Boolean  @default(true)
  errorMessage String? @map("error_message")
  createdAt   DateTime @default(now()) @map("created_at")

  license     License  @relation(fields: [licenseId], references: [id], onDelete: Cascade)

  @@index([licenseId, createdAt])
  @@index([UserId, createdAt])
  @@index([ipAddress, createdAt])
  @@map("download_logs")
}

// ============================================
// REVIEWS
// ============================================

model Review {
  id          String        @id @default(cuid())
  productId   String        @map("product_id")
  userId      String        @map("user_id")
  orderItemId String        @unique @map("order_item_id") // verified purchase
  rating      Int           // 1-5
  title       String?
  content     String        @db.Text
  status      ReviewStatus  @default(PENDING)
  helpfulCount Int          @default(0) @map("helpful_count")
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")
  moderatedAt DateTime?     @map("moderated_at")
  moderatedBy String?       @map("moderated_by")

  product     Product       @relation(fields: [productId], references: [id], onDelete: Cascade)
  user        User          @relation(fields: [userId], references: [id], onDelete: Restrict)
  orderItem   OrderItem     @relation(fields: [orderItemId], references: [id], onDelete: Cascade)

  @@index([productId, status])
  @@index([userId])
  @@map("reviews")
}

// ============================================
// SUPPORT TICKETS
// ============================================

model Ticket {
  id          String        @id @default(cuid())
  code        String        @unique @default(cuid()) // TKT-XXXXXX
  userId      String        @map("user_id")
  assigneeId  String?       @map("assignee_id")
  projectId   String?       @map("project_id")
  subject     String
  status      TicketStatus  @default(OPEN)
  priority    TicketPriority @default(MEDIUM)
  tags        String[]
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")
  closedAt    DateTime?     @map("closed_at")
  firstResponseAt DateTime? @map("first_response_at")
  slaBreached Boolean       @default(false) @map("sla_breached")

  user        User          @relation("TicketCreator", fields: [userId], references: [id], onDelete: Restrict)
  assignee    User?         @relation("TicketAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  project     Project?      @relation(fields: [projectId], references: [id], onDelete: SetNull)
  messages    TicketMessage[]

  @@index([userId, status])
  @@index([assigneeId, status])
  @@index([status, priority, createdAt])
  @@map("tickets")
}

model TicketMessage {
  id        String   @id @default(cuid())
  ticketId  String   @map("ticket_id")
  userId    String   @map("user_id")
  content   String   @db.Text
  isInternal Boolean @default(false) @map("is_internal")
  fileUrls  String[] @map("file_urls")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([ticketId, createdAt])
  @@map("ticket_messages")
}

// ============================================
// CUSTOM PROJECTS
// ============================================

model Project {
  id              String        @id @default(cuid())
  code            String        @unique @default(cuid()) // PRJ-XXXXXX
  userId          String        @map("user_id")
  assignedDevId   String?       @map("assigned_dev_id")
  salesId         String?       @map("sales_id")
  title           String
  description     String        @db.Text
  budgetMin       Decimal?      @db.Decimal(12, 2) @map("budget_min")
  budgetMax       Decimal?      @db.Decimal(12, 2) @map("budget_max")
  finalPrice      Decimal?      @db.Decimal(12, 2) @map("final_price")
  deadline        DateTime?
  status          ProjectStatus @default(QUOTE_REQUESTED)
  currentPhase    ProjectPhase  @default(QUOTE)
  contractSignedAt DateTime?    @map("contract_signed_at")
  contractFileUrl String?       @map("contract_file_url")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")
  completedAt     DateTime?     @map("completed_at")
  warrantyExpiresAt DateTime?   @map("warranty_expires_at")

  user            User          @relation("ProjectClient", fields: [userId], references: [id], onDelete: Restrict)
  assignedDev     User?         @relation("ProjectDeveloper", fields: [assignedDevId], references: [id], onDelete: SetNull)
  sales           User?         @relation("ProjectSales", fields: [salesId], references: [id], onDelete: SetNull)
  milestones      ProjectMilestone[]
  messages        ProjectMessage[]
  files           ProjectFile[]
  payments        Payment[]

  @@index([userId, status])
  @@index([assignedDevId, status])
  @@index([status, currentPhase])
  @@map("projects")
}

model ProjectMilestone {
  id          String   @id @default(cuid())
  projectId   String   @map("project_id")
  name        String
  description String?  @db.Text
  amount      Decimal  @db.Decimal(12, 2)
  dueDate     DateTime @map("due_date")
  status      String   @default("pending") // pending, paid, overdue
  paidAt      DateTime? @map("paid_at")
  order       Int      @default(0)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  payments    Payment[]

  @@index([projectId, order])
  @@map("project_milestones")
}

model ProjectMessage {
  id        String   @id @default(cuid())
  projectId String   @map("project_id")
  userId    String   @map("user_id")
  content   String   @db.Text
  isInternal Boolean @default(false) @map("is_internal")
  fileUrls  String[] @map("file_urls")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([projectId, createdAt])
  @@map("project_messages")
}

model ProjectFile {
  id          String   @id @default(cuid())
  projectId   String   @map("project_id")
  uploadedBy  String   @map("uploaded_by")
  name        String
  url         String   // R2 path
  size        BigInt
  mimeType    String   @map("mime_type")
  version     String?  // for handoff files
  type        String   // requirement, design, source, doc, handoff
  createdAt   DateTime @default(now()) @map("created_at")

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId, type])
  @@map("project_files")
}

// ============================================
// CONTENT & MARKETING
// ============================================

model BlogPost {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  excerpt     String?
  content     String   @db.Text
  coverUrl    String?  @map("cover_url")
  authorId    String   @map("author_id")
  status      String   @default("draft") // draft, published, archived
  publishedAt DateTime? @map("published_at")
  seoTitle    String?  @map("seo_title")
  seoDesc     String?  @map("seo_desc")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  author      User     @relation(fields: [authorId], references: [id], onDelete: Restrict)
  categories  BlogPostCategory[]

  @@index([slug])
  @@index([status, publishedAt])
  @@map("blog_posts")
}

model BlogPostCategory {
  postId     String   @map("post_id")
  categoryId String   @map("category_id")

  post       BlogPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([postId, categoryId])
  @@map("blog_post_categories")
}

// ============================================
// SYSTEM & AUDIT
// ============================================

model AuditLog {
  id          String      @id @default(cuid())
  userId      String?     @map("user_id")
  action      AuditAction
  entityType  String      @map("entity_type")
  entityId    String      @map("entity_id")
  oldData     Json?       @map("old_data")
  newData     Json?       @map("new_data")
  ipAddress   String?     @map("ip_address")
  userAgent   String?     @map("user_agent")
  createdAt   DateTime    @default(now()) @map("created_at")

  user        User?       @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt])
  @@index([entityType, entityId])
  @@index([action, createdAt])
  @@map("audit_logs")
}

model Setting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Json
  type      String   // json, string, number, boolean, encrypted
  label     String
  group     String   // payment, email, security, general, license
  isPublic  Boolean  @default(false) @map("is_public")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("settings")
}

// ============================================
// VIEWS (for reporting) - created via migration
// ============================================

// View: monthly_revenue
// View: top_products
// View: customer_lifetime_value
// View: project_financial_summary
```

---

## 3. Key Indexes & Performance Notes

| Table | Critical Indexes | Reason |
|-------|------------------|--------|
| `orders` | `(user_id, status)`, `(status, created_at)`, `(code)` | User history, admin filters, lookup |
| `order_items` | `(order_id)`, `(license_key)` | Order detail, license activation |
| `licenses` | `(user_id, status)`, `(product_id, status)`, `(key)` | Dashboard, product report, activation |
| `download_logs` | `(license_id, created_at)`, `(user_id, created_at)`, `(ip_address, created_at)` | Abuse detection, audit |
| `tickets` | `(user_id, status)`, `(assignee_id, status)`, `(status, priority, created_at)` | Queue views |
| `payments` | `(order_id)`, `(project_id)`, `(provider, provider_ref)`, `(status, created_at)` | Reconciliation |
| `audit_logs` | `(user_id, created_at)`, `(entity_type, entity_id)`, `(action, created_at)` | Compliance queries |

---

## 4. Migration Strategy

```bash
# 1. Initial migration
npx prisma migrate dev --name init_schema

# 2. Add views via raw SQL migration
npx prisma migrate dev --name add_reporting_views --create-only
# Edit generated SQL file to add CREATE VIEW statements

# 3. Seed data (categories, tech stacks, settings, roles)
npx prisma db seed
```

---

## 5. Seed Data Essentials

```typescript
// prisma/seed.ts
const categories = [
  { slug: 'web', name: 'Web Applications' },
  { slug: 'mobile', name: 'Mobile Apps' },
  { slug: 'backend', name: 'Backend & APIs' },
  { slug: 'fullstack', name: 'Full Stack Kits' },
  { slug: 'ui', name: 'UI Components & Design Systems' },
  { slug: 'devops', name: 'DevOps & Infrastructure' },
  { slug: 'ai', name: 'AI & ML' },
];

const techStacks = [
  { name: 'Next.js', slug: 'nextjs', color: '#000000' },
  { name: 'React', slug: 'react', color: '#61DAFB' },
  { name: 'Vue.js', slug: 'vue', color: '#42B883' },
  { name: 'Node.js', slug: 'nodejs', color: '#339933' },
  { name: 'NestJS', slug: 'nestjs', color: '#E0234E' },
  { name: 'Laravel', slug: 'laravel', color: '#FF2D20' },
  { name: 'Python', slug: 'python', color: '#3776AB' },
  { name: 'Go', slug: 'go', color: '#00ADD8' },
  { name: 'PostgreSQL', slug: 'postgresql', color: '#336791' },
  { name: 'MongoDB', slug: 'mongodb', color: '#47A248' },
  { name: 'Docker', slug: 'docker', color: '#2496ED' },
  { name: 'Kubernetes', slug: 'kubernetes', color: '#326CE5' },
  { name: 'Tailwind CSS', slug: 'tailwind', color: '#06B6D4' },
  { name: 'TypeScript', slug: 'typescript', color: '#3178C6' },
];

const settings = [
  { key: 'site.name', value: 'SourceBan', type: 'string', group: 'general', label: 'Tên trang web', isPublic: true },
  { key: 'site.url', value: 'https://sourceban.dev', type: 'string', group: 'general', label: 'URL trang web', isPublic: true },
  { key: 'license.default_download_limit', value: 5, type: 'number', group: 'license', label: 'Giới hạn tải xuống mặc định' },
  { key: 'license.default_domain_limit', value: 1, type: 'number', group: 'license', label: 'Giới hạn domain mặc định' },
  { key: 'license.default_support_months', value: 6, type: 'number', group: 'license', label: 'Tháng hỗ trợ mặc định' },
  { key: 'payment.stripe.enabled', value: true, type: 'boolean', group: 'payment', label: 'Bật Stripe' },
  { key: 'payment.payos.enabled', value: true, type: 'boolean', group: 'payment', label: 'Bật PayOS' },
  { key: 'email.from', value: 'noreply@sourceban.dev', type: 'string', group: 'email', label: 'Email gửi' },
  { key: 'security.rate_limit.login', value: 5, type: 'number', group: 'security', label: 'Rate limit đăng nhập (req/min)' },
  { key: 'security.rate_limit.license_activate', value: 10, type: 'number', group: 'security', label: 'Rate limit kích hoạt license (req/min)' },
  { key: 'storage.r2.bucket', value: 'sourceban-files', type: 'string', group: 'storage', label: 'R2 bucket name' },
];
```

---

## 6. Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| DBA / Tech Lead | | | |
| Backend Lead | | | |

> **Next**: `docs/wireframes-plan.md` — Kế hoạch wireframe/UI các màn hình chính