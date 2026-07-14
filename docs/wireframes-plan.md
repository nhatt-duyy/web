# Wireframes & UI Plan — Source Code Marketplace + Custom Dev

> **Phase 0 Deliverable** — Kế hoạch wireframe cho Figma
> **Công cụ**: Figma (design system + prototypes)
> **Handoff**: DevMode cho FE team, asset export (SVG/PNG/WebP)

---

## 1. Design System Foundation (Shared Package `@sourceban/ui`)

### 1.1 Color Palette (Tailwind CSS v4 + CSS Variables)

```css
/* apps/web/src/styles/globals.css */
:root {
  /* Brand */
  --color-primary-50: #f0f9ff;
  --color-primary-100: #e0f2fe;
  --color-primary-500: #0ea5e9;
  --color-primary-600: #0284c7;
  --color-primary-700: #0369a1;
  --color-primary-900: #0c4a6e;

  /* Neutral (slate) */
  --color-neutral-50: #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-500: #64748b;
  --color-neutral-900: #0f172a;

  /* Semantic */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Surface */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-bg-tertiary: #f1f5f9;
  --color-border: #e2e8f0;
  --color-border-focus: #0ea5e9;

  /* Dark mode (future Phase 8) */
  @media (prefers-color-scheme: dark) {
    --color-bg-primary: #0f172a;
    --color-bg-secondary: #1e293b;
    --color-bg-tertiary: #334155;
    --color-border: #334155;
    --color-neutral-50: #94a3b8;
    --color-neutral-900: #f8fafc;
  }
}
```

### 1.2 Typography Scale

| Token | Size/Weight | Usage |
|-------|-------------|-------|
| `text-display` | 48px/700 | Hero headlines |
| `text-h1` | 36px/700 | Page titles |
| `text-h2` | 30px/600 | Section headers |
| `text-h3` | 24px/600 | Card titles |
| `text-body-lg` | 18px/400 | Lead paragraphs |
| `text-body` | 16px/400 | Default body |
| `text-body-sm` | 14px/400 | Secondary text |
| `text-caption` | 12px/500 | Labels, badges |
| `text-mono` | 14px/400 | Code, license keys |

Font: **Inter** (variable) + **JetBrains Mono** (code)

### 1.3 Spacing & Radius

- Base unit: `4px` (Tailwind default)
- Radius: `rounded-sm (2px)`, `rounded-md (6px)`, `rounded-lg (8px)`, `rounded-xl (12px)`, `rounded-full`
- Shadows: `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`

### 1.4 Component Library (shadcn/ui base + custom)

| Component | Variants | Status |
|-----------|----------|--------|
| Button | primary, secondary, outline, ghost, destructive, link | ✅ shadcn |
| Input | default, error, success, with icon | ✅ shadcn |
| Select | single, multi, searchable | ✅ shadcn |
| Card | default, bordered, elevated, interactive | ✅ shadcn |
| Badge | default, success, warning, error, outline | ✅ shadcn |
| Avatar | image, fallback, group, status indicator | ✅ shadcn |
| DropdownMenu | checkbox, radio, separator, shortcut | ✅ shadcn |
| Dialog | default, alert, form, fullscreen | ✅ shadcn |
| Sheet | mobile drawer, filter panel | ✅ shadcn |
| Tabs | default, underline, pills | ✅ shadcn |
| Table | sortable, selectable, expandable, virtualized | ✅ shadcn + TanStack Table |
| DataGrid | inline edit, bulk actions, column resize | Phase 3 |
| Toast | success, error, warning, info, promise | ✅ sonner |
| Tooltip | default, delay, interactive | ✅ shadcn |
| Pagination | default, infinite scroll | ✅ shadcn |
| Breadcrumb | default, collapsible | ✅ shadcn |
| Stepper | horizontal, vertical, clickable | Custom |
| KanbanBoard | drag-drop, columns, cards | @dnd-kit (Phase 4) |
| FileUpload | drag-drop, progress, preview, multi | Custom + uploadthing/R2 |
| CodeBlock | syntax highlight, copy, line numbers | shiki + custom |
| LicenseKeyDisplay | copy, mask, show/hide, qr | Custom |
| PriceDisplay | regular/extended, strikethrough, badge | Custom |
| RatingStars | readonly, interactive, half-star | Custom |
| Skeleton | text, card, table, avatar | ✅ shadcn |

---

## 2. Customer Frontend (Next.js) — Wireframe Pages

### 2.1 Public Pages

| Page | Route | Key Components | Figma Frame Name |
|------|-------|----------------|------------------|
| **Home** | `/` | Hero, StatsBar, FeaturedProducts, Categories, Testimonials, CustomCTA, Footer | `FE-Home` |
| **Products Listing** | `/products` | FilterSidebar, ProductGrid/List, Pagination, SortSelect, SearchBar, URLState | `FE-Products-List` |
| **Product Detail** | `/products/[slug]` | Gallery, InfoTabs (Desc/Docs/Changelog/Reviews), PriceCard, RelatedProducts, StickyCTA | `FE-Product-Detail` |
| **Product Demo Preview** | `/products/[slug]/demo` | Iframe sandbox, mobile/desktop toggle, fullscreen | `FE-Product-Demo` |
| **Cart** | `/cart` | CartItems, CouponInput, OrderSummary, CheckoutCTA, EmptyState | `FE-Cart` |
| **Checkout** | `/checkout` | Stepper (Info → Payment → Confirm), FormFields, PaymentMethods, OrderReview | `FE-Checkout` |
| **Checkout Success** | `/checkout/success` | OrderConfetti, OrderSummary, NextSteps (download, license, support) | `FE-Checkout-Success` |
| **Search Results** | `/search` | SearchHeader, FilterSidebar, ProductGrid, RecentSearches, PopularTags | `FE-Search` |

### 2.2 Auth Pages

| Page | Route | Key Components |
|------|-------|----------------|
| **Login** | `/auth/login` | Email/Password, Google/GitHub OAuth, ForgotPasswordLink, RegisterLink |
| **Register** | `/auth/register` | Form (name, email, password, confirm), TermsCheckbox, LoginLink |
| **Forgot Password** | `/auth/forgot` | EmailInput, SendLinkButton, BackToLogin |
| **Reset Password** | `/auth/reset` | NewPassword, Confirm, TokenValidation |
| **Verify Email** | `/auth/verify` | TokenValidation, ResendButton, Success/Error states |

### 2.3 Customer Dashboard (Protected)

| Page | Route | Key Components |
|------|-------|----------------|
| **Dashboard Home** | `/dashboard` | StatsCards (orders, licenses, tickets), RecentOrders, ActiveLicenses, QuickActions |
| **Orders History** | `/dashboard/orders` | OrderTable (sortable, filterable), OrderDetailDrawer, ReorderButton, DownloadInvoice |
| **Order Detail** | `/dashboard/orders/[id]` | Timeline (pending→paid→fulfilled), LicenseKeys, DownloadButtons (with countdown), InvoiceDownload |
| **Licenses** | `/dashboard/licenses` | LicenseGrid (card: product, type, status, domain, downloads left, expiry), ActivateModal, DeactivateButton |
| **License Detail** | `/dashboard/licenses/[key]` | Full info, ActivationHistory, DownloadLog, QRCode for mobile |
| **Tickets** | `/dashboard/tickets` | TicketList (status badges), CreateTicketButton, FilterTabs |
| **Ticket Detail** | `/dashboard/tickets/[id]` | MessageThread (customer/support), Attachments, StatusDropdown (customer: reopen only), RatingOnClose |
| **Create Ticket** | `/dashboard/tickets/new` | CategorySelect, PrioritySelect, Subject, Description (rich text), FileUpload |
| **Profile** | `/dashboard/profile` | AvatarUpload, Name/Email/Phone, PasswordChange, NotificationPreferences, ConnectedAccounts |
| **Addresses** | `/dashboard/addresses` | AddressList, DefaultBilling/Shipping, AddEditModal |
| **Referral** | `/dashboard/referral` | ReferralLink, Stats (clicks, conversions, earnings), PayoutHistory, ShareButtons |

---

## 3. Admin Panel (React SPA) — Wireframe Pages

### 3.1 Layout Structure

```
AdminLayout
├── Sidebar (collapsible)
│   ├── Logo + Brand
│   ├── Navigation Groups
│   │   ├── Overview (Dashboard)
│   │   ├── Catalog (Products, Categories, Tech Stacks, Versions)
│   │   ├── Sales (Orders, Payments, Coupons, Licenses, Invoices)
│   │   ├── Customers (Users, CRM, Tickets, Segments)
│   │   ├── Projects (Custom Dev Kanban, All Projects, Milestones)
│   │   ├── Content (Blog, Pages, Banners, Email Templates)
│   │   ├── Settings (General, Payment, Email, Security, License, Roles)
│   │   └── System (Audit Logs, Webhooks, Backups, Health)
│   └── UserMenu (profile, switch role, logout)
├── Header
│   ├── Breadcrumbs
│   ├── GlobalSearch (Cmd+K)
│   ├── Notifications
│   └── UserAvatar
└── Main Content Area
```

### 3.2 Admin Pages

| Page | Route | Key Components |
|------|-------|----------------|
| **Dashboard** | `/admin` | KPICards (rev, orders, conv rate, AOV), RevenueChart (Recharts), TopProductsTable, RecentActivityFeed, QuickActions |
| **Products List** | `/admin/products` | DataGrid (tanstack), ColumnPicker, BulkActions (publish, archive, delete), FilterDrawer, CreateButton |
| **Product Create/Edit** | `/admin/products/new \| /:id/edit` | TabbedForm: Basic, Media, Pricing/Licenses, Versions/Changelog, SEO, Advanced; FileUploadZone, RichTextEditor (TipTap), TagInput |
| **Categories** | `/admin/categories` | TreeView (nestable), InlineEdit, DragReorder, IconPicker |
| **Orders** | `/admin/orders` | DataGrid, StatusBadge (click→dropdown), PaymentStatusSync, RefundModal, ExportCSV, DetailDrawer |
| **Order Detail** | `/admin/orders/:id` | Timeline, CustomerInfo, Items, PaymentHistory, LicenseKeys, Notes, Actions |
| **Payments** | `/admin/payments` | ReconciliationTable (gateway vs internal), DisputeList, RefundWorkflow, Export |
| **Coupons** | `/admin/coupons` | DataGrid, CreateModal (type, value, limits, dates, stackable), UsageChart |
| **Licenses** | `/admin/licenses` | DataGrid (filter: product, status, user), BulkRevoke, BulkExtend, ActivationLogDrawer |
| **Users** | `/admin/users` | DataGrid, RoleBadge, ImpersonateButton, DetailDrawer (orders, licenses, tickets, projects, notes, tags) |
| **CRM / Customers** | `/admin/customers` | SegmentBuilder (RFM), TagManager, ExportSegment, LTVChart, CommunicationLog |
| **Tickets** | `/admin/tickets` | KanbanView (status columns), PriorityFlags, SLATimer, AssignmentDropdown, BulkActions |
| **Ticket Detail** | `/admin/tickets/:id` | SplitView: Thread (left) + Metadata (right), InternalNotes, CannedResponses, StatusTransition |
| **Projects (Custom Dev)** | `/admin/projects` | KanbanBoard (7 columns), ProjectCard (code, client, value, phase, assignee, due), FilterTabs |
| **Project Detail** | `/admin/projects/:id` | Tabbed: Overview, Milestones, Messages, Files, Payments, ActivityLog |
| **Milestones** | `/admin/projects/:id/milestones` | MilestoneList, InlineEdit, PaymentStatus, InvoiceGen |
| **Content / Blog** | `/admin/content/blog` | PostList, StatusFilter, SEOPreview, SchedulePublish, RichEditor |
| **Banners** | `/admin/content/banners` | BannerGrid, DragReorder, A/B Test Variant, Schedule |
| **Email Templates** | `/admin/content/emails` | TemplateList, PreviewModal (with sample data), MJML Editor, TestSend |
| **Settings - General** | `/admin/settings/general` | SiteName, URL, Logo, Favicon, MaintenanceMode, AnalyticsIDs |
| **Settings - Payment** | `/admin/settings/payment` | StripeKeys, PayOSKeys, TestModeToggle, WebhookURLs, Currency, TaxRate |
| **Settings - Email** | `/admin/settings/email` | ProviderConfig, FromAddress, TemplatesMapping, TestSend |
| **Settings - Security** | `/admin/settings/security` | RateLimits, CSP, CORS, 2FAEnforcement, PasswordPolicy, SessionTimeout |
| **Settings - License** | `/admin/settings/license` | DefaultLimits, WatermarkConfig, ActivationRules, EncryptionKeys |
| **Settings - Roles** | `/admin/settings/roles` | RoleMatrix (resource × action), CreateRole, AssignUsers |
| **Audit Logs** | `/admin/system/audit` | DataGrid (user, action, entity, time), FilterDrawer, Export |
| **Webhooks** | `/admin/system/webhooks` | EndpointList, SecretRotation, DeliveryLog, RetryFailed |
| **Backups** | `/admin/system/backups` | ScheduleConfig, BackupList (download, restore), S3/R2 Sync Status |
| **Health** | `/admin/system/health` | ServiceStatus (DB, Redis, MeiliSearch, R2, Email), MetricsCharts |

---

## 4. Responsive Breakpoints

| Breakpoint | Tailwind | Target |
|------------|----------|--------|
| Mobile | `< 640px` | `sm:` |
| Tablet | `640px - 1024px` | `md:` |
| Desktop | `1024px - 1280px` | `lg:` |
| Wide | `> 1280px` | `xl:` |
| Ultra-wide | `> 1536px` | `2xl:` |

**Admin Panel**: Fixed sidebar on `lg+`, Sheet/Drawer on `md-`
**Customer FE**: Mobile-first, progressive enhancement

---

## 5. Figma File Structure

```
SourceBan Design System (Team Library)
├── 01 Foundations
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Shadows
│   ├── Border Radius
│   ├── Z-Index
│   └── Breakpoints
├── 02 Components (Atomic)
│   ├── Buttons
│   ├── Inputs
│   ├── Selects
│   ├── Cards
│   ├── Badges
│   ├── Avatars
│   ├── Dropdowns
│   ├── Dialogs
│   ├── Toasts
│   ├── Tooltips
│   ├── Tables
│   ├── Pagination
│   ├── Breadcrumbs
│   ├── Steppers
│   ├── File Upload
│   ├── Code Block
│   ├── License Key
│   ├── Price Display
│   └── Rating Stars
├── 03 Components (Molecular)
│   ├── Product Card (grid/list)
│   ├── Filter Sidebar
│   ├── Cart Item
│   ├── Order Row
│   ├── License Card
│   ├── Ticket Row
│   ├── Project Card (Kanban)
│   ├── Stat Card
│   ├── Chart Container
│   └── Data Grid Wrapper
├── 04 Templates (Pages)
│   ├── Customer
│   │   ├── Home
│   │   ├── Products List
│   │   ├── Product Detail
│   │   ├── Cart
│   │   ├── Checkout (3 steps)
│   │   ├── Auth (login, register, forgot, reset, verify)
│   │   ├── Dashboard Home
│   │   ├── Orders List
│   │   ├── Order Detail
│   │   ├── Licenses
│   │   ├── License Detail
│   │   ├── Tickets List
│   │   ├── Ticket Detail
│   │   ├── Create Ticket
│   │   ├── Profile
│   │   └── Referral
│   └── Admin
│       ├── Dashboard
│       ├── Products List
│       ├── Product Form
│       ├── Categories
│       ├── Orders List
│       ├── Order Detail
│       ├── Payments
│       ├── Coupons
│       ├── Licenses
│       ├── Users
│       ├── CRM
│       ├── Tickets Kanban
│       ├── Ticket Detail
│       ├── Projects Kanban
│       ├── Project Detail
│       ├── Blog
│       ├── Banners
│       ├── Email Templates
│       ├── Settings (6 tabs)
│       ├── Audit Logs
│       ├── Webhooks
│       ├── Backups
│       └── Health
├── 05 Prototypes
│   ├── Customer Purchase Flow
│   ├── Admin Product Management
│   ├── Custom Project Kanban
│   └── Ticket Resolution
└── 06 Handoff Notes
    ├── Component Props Table
    ├── Responsive Behavior
    ├── State Matrix (empty, loading, error, success)
    ├── Accessibility Checklist
    └── Animation Specs
```

---

## 6. Key User Flows to Prototype

| Flow | Screens | Critical Interactions |
|------|---------|----------------------|
| **Purchase Flow** | Home → Product → Cart → Checkout (3 steps) → Success → Dashboard | License generation, email trigger, download link |
| **License Activation** | Dashboard → License Detail → Activate Modal → Success | Domain binding, download count decrement |
| **Ticket Flow** | Dashboard → Create Ticket → Detail → Support Reply → Close + Rate | SLA timer, internal notes, file attach |
| **Custom Project** | Custom Page → Quote Form → Admin Kanban → Milestones → Handoff → Warranty | Phase transitions, payment per milestone |
| **Admin Product CRUD** | List → Create/Edit (tabs) → Media Upload → Publish | Versioning, changelog, license config |

---

## 7. Asset Export Specs

| Asset Type | Format | Naming | Optimization |
|------------|--------|--------|--------------|
| Icons | SVG | `icon-[name]-[size].svg` | SVGO, viewBox 24x24 |
| Illustrations | WebP (lossless) | `illust-[name]-[width]w.webp` | cwebp -lossless |
| Product Placeholders | WebP | `placeholder-product-[ratio].webp` | BlurHash LQIP |
| Fonts | WOFF2 | `inter-var.woff2`, `jetbrains-mono.woff2` | Subset latin + vietnamese |

---

## 8. Accessibility Checklist (WCAG 2.1 AA)

- [ ] Semantic HTML (landmarks, headings hierarchy)
- [ ] Color contrast ≥ 4.5:1 (text), 3:1 (UI components)
- [ ] Focus visible (outline-offset-2, focus-ring)
- [ ] Keyboard navigation (Tab, Enter, Esc, Arrow keys)
- [ ] ARIA labels on icon buttons, dynamic regions
- [ ] Live regions for toasts, form errors, cart updates
- [ ] Skip to main content link
- [ ] Alt text for all images (decorative: `alt=""`)
- [ ] Form labels associated, error messages linked via `aria-describedby`
- [ ] Modal trap focus, restore on close
- [ ] Reduced motion respected (`prefers-reduced-motion`)

---

## 9. Animation & Motion Specs

| Interaction | Duration | Easing | Notes |
|-------------|----------|--------|-------|
| Page transition (Next.js) | 150ms | ease-out | Layout shift prevention |
| Modal/Dialog open | 200ms | ease-out | Backdrop fade + scale |
| Dropdown open | 100ms | ease-out | No backdrop |
| Toast enter | 300ms | ease-out | Slide from bottom-right |
| Toast exit | 200ms | ease-in | Fade + slide down |
| Button press | 50ms | ease-out | Scale 0.98 |
| Card hover | 200ms | ease-out | Shadow elevation + translateY(-2px) |
| Tab switch | 150ms | ease-out | Cross-fade content |
| Kanban drag | 0ms | - | @dnd-kit defaults |
| Skeleton pulse | 1.5s | ease-in-out | Infinite |

---

## 10. Handoff Checklist (Design → Dev)

- [ ] All components have **DevMode** enabled
- [ ] Component props table filled (variant, size, state)
- [ ] Responsive behavior documented per breakpoint
- [ ] State matrix: default, hover, focus, active, disabled, loading, error, empty
- [ ] Color tokens mapped to CSS variables
- [ ] Spacing tokens mapped to Tailwind config
- [ ] Typography tokens mapped to Tailwind config
- [ ] Icon library imported as React components (lucide-react)
- [ ] Font files in `public/fonts/` with `preload` tags
- [ ] LQIP/BlurHash strings for product images
- [ ] Animation specs in `tailwind.config.ts` keyframes

---

## 11. Timeline & Milestones

| Week | Deliverable | Owner |
|------|-------------|-------|
| 1 | Design System (Foundations + Atomic Components) | Designer |
| 1-2 | Customer Page Templates (Home, Products, Detail, Cart, Checkout) | Designer |
| 2 | Auth Flow Templates | Designer |
| 2-3 | Customer Dashboard Templates | Designer |
| 3 | Admin Layout + Dashboard + Core CRUD Templates | Designer |
| 3-4 | Admin Advanced (Kanban, CRM, Settings) | Designer |
| 4 | Prototypes (4 key flows) | Designer |
| 4 | Design Review & Sign-off | PO + Tech Lead |
| 4-5 | DevMode cleanup, Asset export, Handoff doc | Designer + FE Lead |

---

## 12. Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Design Lead | | | |
| Frontend Lead | | | |

> **Next**: `docs/api-contract.md` — API Endpoint Contracts (OpenAPI 3.1)