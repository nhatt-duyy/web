# Tech Stack Document — Source Code Marketplace

> **Phase 0 Deliverable** — Finalized technology decisions
> **Version**: 1.0
> **Date**: 2026-07-14

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            MONOREPO (Turborepo)                          │
├─────────────────┬─────────────────┬─────────────────┬───────────────────┤
│   apps/web      │  apps/admin     │   apps/api      │   packages/*      │
│   (Next.js 15)  │  (React + Vite) │   (NestJS 11)   │   Shared Libs     │
│   Customer FE   │   Admin Panel   │   Backend API   │   ui, config,     │
│   SSR/ISR       │   SPA           │   REST + Webhook│   types           │
└────────┬────────┴────────┬────────┴────────┬────────┴────────┬──────────┘
         │                 │                 │                 │
         ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┤
│                         INFRASTRUCTURE (VPS Singapore)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │   PostgreSQL │  │    Redis     │  │  MeiliSearch │  │  Cloudflare │  │
│  │    (16)      │  │    (7)       │  │   (v1+)      │  │     R2      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │    Nginx     │  │   Docker     │  │  GitHub      │                   │
│  │  (Reverse    │  │  Compose     │  │  Actions     │                   │
│  │   Proxy)     │  │  (Orchest.)  │  │  (CI/CD)     │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Decisions

### 2.1 Frontend (Customer) — `apps/web`

| Category | Choice | Version | Rationale |
|----------|--------|---------|-----------|
| **Framework** | Next.js | 15 (App Router) | SSR/ISR for SEO, Server Components, Turbopack dev |
| **Language** | TypeScript | 5.5+ | Type safety across stack |
| **Styling** | Tailwind CSS | v4 (Alpha/Beta) | Utility-first, smaller bundle, CSS-first config |
| **UI Components** | shadcn/ui | Latest | Accessible, copy-paste, Radix-based, customizable |
| **Forms** | React Hook Form + Zod | Latest | Performant, schema validation |
| **Data Fetching** | TanStack Query (React Query) | v5 | Server state, caching, mutations |
| **Auth Client** | NextAuth.js (Auth.js) | v5 | Integrated with Next.js, multiple providers |
| **State (Client)** | Zustand | v4 | Lightweight, no boilerplate |
| **Animation** | Framer Motion | v11 | Declarative, performant |
| **Icons** | Lucide React | Latest | Consistent, tree-shakeable |
| **Charts** | Recharts | v2 | React-native, composable |
| **Rich Text** | TipTap | v2 | Headless, ProseMirror-based |
| **Image Optimization** | Next/Image + Cloudflare Images | — | Automatic WebP/AVIF, CDN |
| **Testing** | Vitest + React Testing Library | Latest | Fast, Jest-compatible |
| **E2E Testing** | Playwright | Latest | Cross-browser, reliable |

### 2.2 Admin Panel — `apps/admin`

| Category | Choice | Version | Rationale |
|----------|--------|---------|-----------|
| **Framework** | React | 19 | Latest concurrent features |
| **Build Tool** | Vite | v5 | Fast HMR, optimized builds |
| **Routing** | React Router | v7 | SPA routing, data loading |
| **UI Components** | @sourceban/ui (shared) | — | Consistent with web |
| **State** | Zustand + TanStack Query | — | Same patterns as web |
| **Tables** | TanStack Table | v8 | Headless, powerful |
| **Forms** | React Hook Form + Zod | — | Consistent |
| **Charts** | Recharts | — | Consistent |
| **Drag & Drop** | @dnd-kit/core | v6 | Accessible, performant |
| **Date Picker** | React Day Picker | v9 | Lightweight, accessible |

### 2.3 Backend API — `apps/api`

| Category | Choice | Version | Rationale |
|----------|--------|---------|-----------|
| **Framework** | NestJS | v11 | Modular, DI, decorators, OpenAPI native |
| **Language** | TypeScript | 5.5+ | Shared types with FE |
| **ORM** | Prisma | v5 | Type-safe, migrations, middlewares |
| **Database** | PostgreSQL | 16 | JSONB, RLS, partitioning, mature |
| **Cache** | Redis | 7 (Valkey compatible) | Sessions, rate limit, cache |
| **Search** | MeiliSearch | v1+ | Typo-tolerance, filters, Vietnamese |
| **Auth** | JWT (access) + HttpOnly Cookie (refresh) | — | Secure, scalable |
| **Validation** | class-validator + class-transformer | — | Decorator-based, DTO |
| **API Docs** | @nestjs/swagger | v8 | OpenAPI 3.1, Scalar UI |
| **File Upload** | Multer + R2 SDK | — | Streaming, signed URLs |
| **Email** | Resend (React Email templates) | — | Modern, deliverable |
| **Queue** | BullMQ (Redis) | v5 | Jobs: email, watermark, webhook retry |
| **Scheduling** | @nestjs/schedule | v4 | Cron: cleanup, backup, reports |
| **Testing** | Jest + Supertest | Latest | Unit + Integration |
| **Logging** | Pino | v9 | Structured, fast |

### 2.4 Shared Packages — `packages/*`

| Package | Purpose | Contents |
|---------|---------|----------|
| `@sourceban/ui` | Design System | shadcn/ui components, Tailwind config, theme, hooks |
| `@sourceban/config` | Tooling Config | ESLint, Prettier, TypeScript, Tailwind presets |
| `@sourceban/types` | Shared Types | API contracts (Zod schemas), DTOs, Enums |
| `@sourceban/utils` | Common Utils | Date, currency, string, validation helpers |
| `@sourceban/watermark` | Watermarking Engine | AST transform, zip processing, detection |

---

## 3. Infrastructure & DevOps

### 3.1 Hosting (Production)

| Component | Provider | Spec | Region |
|-----------|----------|------|--------|
| **VPS** | Vultr / DigitalOcean | 4 vCPU, 8GB RAM, 160GB NVMe | Singapore |
| **CDN** | Cloudflare | Pro plan | Global |
| **Object Storage** | Cloudflare R2 | Standard | Auto (APAC) |
| **DNS** | Cloudflare | — | — |
| **SSL** | Cloudflare (Full Strict) | — | — |
| **Email** | Resend | 3k/month free | — |
| **Monitoring** | Sentry (Error) + UptimeRobot (Uptime) | — | — |
| **Logging** | Loki + Grafana (self-hosted) | — | VPS |

### 3.2 Local Development

```yaml
# docker-compose.yml (root)
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: sourceban
      POSTGRES_USER: sourceban
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
    healthcheck: pg_isready -U sourceban -d sourceban

  redis:
    image: valkey/valkey:7-alpine
    ports: ["6379:6379"]
    volumes: [redis_data:/data]
    healthcheck: redis-cli ping

  meilisearch:
    image: getmeili/meilisearch:v1.11
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
    ports: ["7700:7700"]
    volumes: [meili_data:/meili_data]

  minio:  # S3-compatible for local R2 simulation
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD_FILE: /run/secrets/minio_password
    secrets:
      - minio_password
    ports: ["9000:9000", "9001:9001"]
    volumes: [minio_data:/data]

  mailpit:  # Local email testing
    image: axllent/mailpit:latest
    ports: ["1025:1025", "8025:8025"]

secrets:
  db_password:
    file: ./secrets/db_password.txt
  minio_password:
    file: ./secrets/minio_password.txt

volumes:
  postgres_data:
  redis_data:
  meili_data:
  minio_data:
```

### 3.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run lint typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run test --filter=./apps/api --filter=./apps/web --filter=./apps/admin

  build:
    needs: [lint-typecheck, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run build

  docker:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with: { registry: ghcr.io, username: ${{ github.actor }}, password: ${{ secrets.GHCR_TOKEN }} }
      - run: |
          docker build -t ghcr.io/${{ github.repository }}/api:${{ github.sha }} -f apps/api/Dockerfile .
          docker build -t ghcr.io/${{ github.repository }}/web:${{ github.sha }} -f apps/web/Dockerfile .
          docker build -t ghcr.io/${{ github.repository }}/admin:${{ github.sha }} -f apps/admin/Dockerfile .
      - run: |
          docker push ghcr.io/${{ github.repository }}/api:${{ github.sha }}
          docker push ghcr.io/${{ github.repository }}/web:${{ github.sha }}
          docker push ghcr.io/${{ github.repository }}/admin:${{ github.sha }}

  deploy:
    needs: docker
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: deploy
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/sourceban
            docker compose pull
            docker compose up -d --remove-orphans
            docker image prune -f
```

### 3.4 Deployment Architecture (VPS)

```
┌─────────────────────────────────────────────────────────────┐
│                     VPS (Ubuntu 24.04)                       │
├─────────────────────────────────────────────────────────────┤
│  Nginx (Port 80/443)                                        │
│    │                                                         │
│    ├── /api/*     →  apps/api:3001  (Docker)                 │
│    ├── /admin/*   →  apps/admin:3002 (Docker, static)        │
│    └── /*         →  apps/web:3000   (Docker)                │
│                                                              │
│  Docker Network: sourceban_network (internal)                │
│    ├── api                                                      │
│    ├── web                                                       │
│    ├── admin                                                     │
│    ├── postgres                                                  │
│    ├── redis                                                      │
│    ├── meilisearch                                               │
│    └── minio (dev only)                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Database Design Summary

| Aspect | Decision |
|--------|----------|
| **Primary Key** | `cuid()` (25-char, timestamp-sortable) |
| **Timestamps** | `createdAt`, `updatedAt` on all tables |
| **Soft Delete** | `deletedAt` + Prisma middleware |
| **Multi-tenancy** | Single tenant (Phase 0-7), `organizationId` reserved |
| **Migrations** | Prisma Migrate (dev), SQL files (prod) |
| **Seeding** | TypeScript scripts per environment |
| **Backup** | Daily pg_dump + weekly basebackup, encrypted to R2 |

---

## 5. Environment Variables

### 5.1 Shared (Root `.env.example`)

```bash
# App
NODE_ENV=development
TURBO_TOKEN=
TURBO_TEAM=

# Database
DATABASE_URL="postgresql://sourceban:password@localhost:5432/sourceban?schema=public"
DATABASE_URL_TEST="postgresql://sourceban:password@localhost:5432/sourceban_test?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# MeiliSearch
MEILI_HOST="http://localhost:7700"
MEILI_MASTER_KEY="dev-master-key"

# MinIO (Local R2)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY_ID="minioadmin"
S3_SECRET_ACCESS_KEY="minioadmin"
S3_BUCKET="sourceban-files"
S3_REGION="auto"

# Email (Resend)
RESEND_API_KEY="re_xxx"
EMAIL_FROM="SourceBan <noreply@sourceban.dev>"
EMAIL_REPLY_TO="support@sourceban.dev"

# Auth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="different-from-nextauth-secret"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Payments
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_PUBLISHABLE_KEY="pk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
PAYOS_CLIENT_ID=""
PAYOS_API_KEY=""
PAYOS_CHECKSUM_KEY=""
PAYOS_WEBHOOK_URL=""

# Security
LICENSE_HMAC_SECRET="generate-64-char-hex"
ENCRYPTION_KEY="generate-32-char-base64"
WATERMARK_KEY="generate-32-char-base64"

# Rate Limit
RATE_LIMIT_AUTH_MAX=5
RATE_LIMIT_AUTH_WINDOW_MS=60000
RATE_LIMIT_API_MAX=100
RATE_LIMIT_API_WINDOW_MS=60000

# Monitoring
SENTRY_DSN=""
SENTRY_ORG=""
SENTRY_PROJECT=""
```

### 5.2 Per-App Overrides

| App | Additional Variables |
|-----|---------------------|
| `apps/web` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_STRIPE_KEY`, `NEXT_PUBLIC_PAYOS_CLIENT_ID` |
| `apps/admin` | `VITE_API_URL`, `VITE_WS_URL` |
| `apps/api` | `PORT=3001`, `CORS_ORIGIN=http://localhost:3000,http://localhost:3002` |

---

## 6. Coding Standards

### 6.1 TypeScript Strict Mode

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### 6.2 ESLint + Prettier

```javascript
// packages/config/eslint-config/index.js
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'airbnb',
    'airbnb-typescript',
    'plugin:@next/next/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './packages/*/tsconfig.json']
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'prettier', 'import'],
  rules: {
    'prettier/prettier': 'error',
    'react/react-in-jsx-scope': 'off',
    'react/require-default-props': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/order': ['error', { groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'], 'newlines-between': 'always' }]
  },
  settings: {
    'import/resolver': { typescript: { alwaysTryTypes: true } },
    react: { version: '18.3' }
  }
}
```

### 6.3 Git Conventions

| Convention | Standard |
|------------|----------|
| **Branch** | `feat/`, `fix/`, `chore/`, `refactor/`, `docs/`, `test/` + short-kebab-case |
| **Commit** | Conventional Commits: `type(scope): subject` |
| **PR** | Template with checklist, linked issue |
| **Review** | Minimum 1 approval (self-merge allowed for solo) |
| **Merge** | Squash and merge, delete branch |

---

## 7. Package Manager & Monorepo

| Tool | Version | Config |
|------|---------|--------|
| **pnpm** | 9.x | `pnpm-workspace.yaml`, `catalog:` for shared deps |
| **Turborepo** | 2.x | `turbo.json` with pipeline |
| **Node** | 22 LTS | `.nvmrc`, `.tool-versions` |

```yaml
# pnpm-workspace.yaml
packages:
  - apps/*
  - packages/*
catalog:
  typescript: ^5.5
  react: ^19
  react-dom: ^19
  next: ^15
  nestjs: ^11
  prisma: ^5
  tailwindcss: ^4
  zod: ^3
  tanstack-query: ^5
  zustand: ^4
```

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**", "build/**"] },
    "lint": { "outputs": [] },
    "typecheck": { "outputs": [] },
    "test": { "outputs": ["coverage/**"], "dependsOn": [] },
    "dev": { "cache": false, "persistent": true },
    "db:push": { "cache": false },
    "db:migrate": { "cache": false },
    "db:seed": { "cache": false },
    "db:studio": { "cache": false }
  },
  "globalEnv": ["DATABASE_URL", "REDIS_URL"]
}
```

---

## 8. Version Compatibility Matrix

| Package | Version | Notes |
|---------|---------|-------|
| Node.js | 22.x (LTS) | `.nvmrc` |
| pnpm | 9.x | Corepack enabled |
| TypeScript | 5.5+ | Strict mode |
| React | 19 | Concurrent features |
| Next.js | 15 | App Router, Turbopack |
| NestJS | 11 | Decorators, OpenAPI |
| Prisma | 5.18+ | Postgres 16 |
| Tailwind | 4.0 (beta) | CSS-first |
| MeiliSearch | 1.11+ | Vietnamese support |
| Cloudflare R2 | S3 API | Standard tier |

---

## 9. Future Considerations (Phase 8+)

| Area | Potential Evolution |
|------|---------------------|
| **Search** | MeiliSearch → Elasticsearch (if >100k products) |
| **Queue** | BullMQ → Temporal (workflow orchestration) |
| **Auth** | NextAuth → Dedicated Auth Service (Ory/Kratos) |
| **Database** | Single PG → Read replicas + Citus (sharding) |
| **Hosting** | VPS → Kubernetes (EKS/GKE) |
| **Observability** | Sentry + UptimeRobot → Datadog/Grafana Cloud |
| **Multi-region** | Single SG → Active-Active (SG + US/EU) |

---

## 10. Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tech Lead | | | |
| Frontend Lead | | | |
| Backend Lead | | | |
| DevOps | | | |

> **Next Step**: Initialize monorepo with Turborepo + pnpm + all apps/packages scaffolded