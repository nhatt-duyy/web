# CLAUDE.md — Project Guidelines for Source Code Marketplace + Custom Dev Website

> **Project**: Website bán Source Code + Dịch vụ Custom Development  
> **Planning docs**: `docs/ke-hoach-website-ban-source-code.md` (overview) + `docs/ke-hoach-chi-tiet-theo-phase.md` (phase-by-phase)

---

## 🇻🇳 NGÔN NGỮ BẮT BUỘC

> **LUÔN LUÔN TRẢ LỜI BẰNG TIẾNG VIỆT** — Không trả lời bằng bất kỳ ngôn ngữ nào khác (English, Chinese, Japanese, v.v.) trong mọi tình huống. Toàn bộ giao tiếp, giải thích, code comments, tài liệu, commit messages đều phải bằng tiếng Việt.

---

## 📋 Core Rules — MUST FOLLOW

| Rule | Description |
|------|-------------|
| **Phase Order** | Execute phases strictly in order: Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. No skipping. |
| **Phase Completion** | Each phase must reach its "Definition of Done" before starting the next. |
| **Parallel Work** | Parallel tracks allowed only per Phase 8 note (e.g., Phase 3 Admin + Phase 2 Frontend in parallel IF team capacity allows). |
| **Phase Review** | End of each phase = mandatory review + plan adjustment before next phase. |
| **No Code Without Plan** | Never write implementation code before Phase 0 deliverables (specs, ERD, wireframes, API contracts, repo setup) are approved. |

---

## 🏗️ Tech Stack — CHỐT (D (Đã XÁCH)

| Layer | Stack | Ghi Chú |
|-------|-------|---------|
| **Frontend (Khách)** | **Next.js 15 (App Router, React 19)** — SSR/ISR cho SEO, marketplace nhanh | ✅ Chốt |
| **Admin Panel** | **React 19 SPA (Vite)** + shadcn/ui + Tailwind — dùng chung design system | ✅ Chốt |
| **Backend/API** | **NestJS 11** (TypeScript, module-based, DI) — đồng bộ type với FE | ✅ Chốt (khuyên dùng NestJS cho solo TS dev) |
| **Database** | **PostgreSQL 16** (Prisma ORM) — quan hệ: users, orders, licenses, projects, tickets | ✅ Chốt |
| **Object Storage** | **Cloudflare R2** (S3-compatible, 0 egress fee, rẻ) — lưu file source mã hóa | ✅ Chốt |
| **Search** | **MeiliSearch** (self-hosted nhẹ, tiếng Việt tốt, filter đa tiêu chí) — Phase 2+ | ✅ Chốt |
| **Thanh Toán** | **Quốc tế:** Stripe  \n **Việt Nam:** **PayOS** (dev-friendly, sandbox tốt, phí hợp lý) | ✅ Chốt |
| **Auth** | **NextAuth.js v5 (Auth.js)** + JWT + OAuth (Google, GitHub) — tích hợp sẵn Next.js | ✅ Chốt |
| **Hosting** | **Vultr / DigitalOcean (Singapore)** — VPS Ubuntu 24.04 + Docker + Cloudflare CDN | ✅ Chốt |
| **CI/CD** | **GitHub Actions** → Docker image → Deploy VPS (coolify/kamal/script tự viết) | ✅ Chốt |
| **Monitoring** | **Sentry** (error tracking) + **UptimeRobot** (uptime) + **Prometheus/Grafana** (tuỳ chọn sau) | ✅ Chốt |
| **Email** | **Resend** (API hiện đại, 3k emails/tháng free, React Email template) | ✅ Chốt |
| **Monorepo** | **Turborepo + pnpm workspaces** — 3 apps (web, admin, api) + shared packages | ✅ Chốt |
| **Design System** | **shadcn/ui + Tailwind CSS v4** — accessible, copy-paste, customizable | ✅ Chốt |
| **Team** | **Solo dev** — chạy tuần tự các phase, tối ưu CI/CD tự động | ✅ Chốt |
| **Launch Target** | **Theo kế hoạch ~5 tháng** (Phase 0-7) | ✅ Chốt |

---

## 📁 Expected Folder Structure (Monorepo suggestion)

```
source-ban-main/
├── .claude/                      # Claude Code config, memory
├── docs/
│   ├── ke-hoach-website-ban-source-code.md
│   ├── ke-hoach-chi-tiet-theo-phase.md
│   ├── feature-spec.md           # Phase 0 deliverable
│   ├── erd.md                    # Phase 0 deliverable
│   ├── api-contract.md           # Phase 0 deliverable
│   ├── security-plan.md          # Phase 0 deliverable
│   └── wireframes/               # Figma exports or screenshots
├── apps/
│   ├── web/                      # Next.js (Customer Frontend)
│   │   ├── src/
│   │   │   ├── app/              # App Router pages
│   │   │   ├── components/       # Shared UI components
│   │   │   ├── lib/              # Utilities, API client
│   │   │   ├── hooks/            # Custom hooks
│   │   │   ├── styles/           # Global styles, Tailwind config
│   │   │   └── types/            # TypeScript types
│   │   ├── public/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   ├── admin/                    # React SPA (Admin Panel)
│   │   ├── src/
│   │   │   ├── pages/            # Page components
│   │   │   ├── components/       # Admin-specific components
│   │   │   ├── layouts/          # Layout wrappers (sidebar, header)
│   │   │   ├── services/         # API services
│   │   │   ├── stores/           # State (Zustand/Redux)
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   └── types/
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.ts        # Vite for SPA
│   │
│   └── api/                      # NestJS (Backend API)
│       ├── src/
│       │   ├── modules/          # Feature modules (auth, products, orders, licenses, projects, tickets, payments, users, content)
│       │   │   └── [module]/
│       │   │       ├── controllers/
│       │   │       ├── services/
│       │   │       ├── dto/
│       │   │       ├── entities/
│       │   │       ├── repositories/
│       │   │       └── guards/
│       │   ├── common/           # Shared: guards, interceptors, pipes, filters, decorators
│       │   ├── config/           # Configuration modules
│       │   ├── database/         # Migrations, seeds, factories
│       │   └── main.ts
│       ├── prisma/               # Prisma schema + migrations (if NestJS + Prisma)
│       │   └── schema.prisma
│       ├── package.json
│       └── nest-cli.json
│
├── packages/                     # Shared packages (monorepo)
│   ├── ui/                       # Shared React component library (design system)
│   │   ├── src/components/
│   │   ├── src/hooks/
│   │   ├── src/utils/
│   │   └── package.json
│   │
│   ├── config/                   # Shared configs (ESLint, Prettier, TSConfig, Tailwind)
│   │   ├── eslint-config/
│   │   ├── prettier-config/
│   │   └── tsconfig/
│   │
│   └── types/                    # Shared TypeScript types (API contracts, DTOs)
│       ├── src/
│       └── package.json
│
├── infrastructure/               # Infra as Code
│   ├── docker/
│   │   ├── docker-compose.yml    # Local dev stack (Postgres, Redis, MeiliSearch, MinIO, Mailpit)
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.web
│   │   └── Dockerfile.admin
│   ├── kubernetes/               # K8s manifests (if K8s)
│   └── terraform/                # Terraform (if cloud infra)
│
├── scripts/                      # Utility scripts (seed, migrate, deploy, backup)
│
├── .github/
│   └── workflows/                # CI/CD pipelines
│
├── .env.example                  # Env template
├── .gitignore
├── package.json                  # Root package.json (workspaces)
├── turbo.json                    # Turborepo config (if using Turborepo)
├── README.md
└── CLAUDE.md                     # ← THIS FILE
```

> **Note**: Folder structure assumes **Turborepo** or **Nx** monorepo. Confirm if you want monorepo vs separate repos.

---

## 📦 Phase Summary & Key Deliverables

| Phase | Weeks | Key Deliverable | Claude Action |
|-------|-------|-----------------|---------------|
| **0** | 1-2 | Feature Spec, ERD, Wireframes, API Contract, Security Plan, Repo + CI/CD | **Planning only** — create specs, no implementation code |
| **1** | 3-6 | Working MVP: browse → buy → download → email | Implement core FE/BE, auth, payments (1 gateway), basic admin |
| **2** | 7-9 | Full marketplace: search, reviews, multi-license, customer dashboard | Advanced FE features, MeiliSearch, coupon system |
| **3** | 10-13 | Full Admin Panel: KPI, CRM, RBAC, CMS, Helpdesk | Admin SPA + RBAC + reporting |
| **4** | 14-16 | Custom Dev Module: quote flow, Kanban, milestones, warranty | Custom project workflow end-to-end |
| **5** | 17-18 | Security hardening: license keys, watermark, encrypted downloads, audit | License enforcement, watermarking, security audit |
| **6** | 19-20 | QA, performance, accessibility, UAT | Testing, load test, a11y audit |
| **7** | 21 | Production launch | Deploy, monitor, support readiness |
| **8** | 21+ | Growth: SEO, affiliate, multi-lang, seller marketplace | Ongoing feature work |

---

## ❓ Câu Hỏi — ĐÃ TRẢ LỜI (2026-07-14)

| # | Câu Hỏi | Trả Lời |
|---|---------|---------|
| 1 | Backend framework | **NestJS 11** (TypeScript-first, module-based) |
| 2 | Object storage | **Cloudflare R2** (S3-compatible, 0 egress fee) |
| 3 | VN Payment Gateway | **PayOS** (sandbox tốt, phí hợp lý, dev-friendly) |
| 4 | Search Engine | **MeiliSearch** (self-hosted, tiếng Việt, filter nhanh) |
| 5 | Email Provider | **Resend** (React Email, 3k free/tháng, API hiện đại) |
| 6 | Hosting + Region | **Vultr / DigitalOcean — Singapore** (latency thấp APAC) |
| 7 | Monorepo Tool | **Turborepo + pnpm workspaces** (3 apps + shared packages) |
| 8 | Team Size & Roles | **Solo dev** (chạy tuần tự phase, tự động hóa CI/CD) |
| 9 | Target Launch Date | **Theo kế hoạch ~5 tháng** (Phase 0-7) |
| 10 | Design System | **shadcn/ui + Tailwind CSS v4** (accessible, copy-paste) |
| 11 | Auth Provider | **NextAuth.js v5 (Auth.js)** + JWT + OAuth (Google, GitHub) |

---

## 🚀 Next Step

**Please answer the questions above** (or say "use defaults" for any you're flexible on). Once confirmed, I'll:

1. Update `CLAUDE.md` with your decisions
2. Begin **Phase 0 deliverables** (specs, ERD, wireframes plan, API contracts, security plan, repo scaffold)
3. Present Phase 0 deliverables for your approval before any implementation

---

*Generated from planning docs on 2026-07-14. Update this file as decisions are made.*