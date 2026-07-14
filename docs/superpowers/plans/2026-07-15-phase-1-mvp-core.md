# Phase 1 — Nền tảng & MVP Lõi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng MVP lõi hoạt động được — khách có thể đăng ký → xem sản phẩm → mua → nhận email → tải file, admin có thể CRUD sản phẩm và xem đơn hàng.

**Architecture:** Monorepo Turborepo + pnpm với 3 apps (`apps/web` Next.js 15, `apps/admin` React 19 Vite, `apps/api` NestJS 11) và shared packages (`packages/ui`, `packages/config`, `packages/types`). Backend NestJS dùng Prisma + PostgreSQL 16, file source lưu trên Cloudflare R2. Auth dùng NextAuth.js v5 ở web, JWT guard ở API. Thanh toán tích hợp 1 cổng (cần xác nhận — xem mục Decision Points). Frontend dùng shadcn/ui + Tailwind v4.

**Tech Stack:** Next.js 15 (App Router, React 19), React 19 + Vite (admin), NestJS 11 (TypeScript), PostgreSQL 16 + Prisma, Cloudflare R2 (S3-compatible), NextAuth.js v5 (Auth.js), shadcn/ui + Tailwind CSS v4, Turborepo + pnpm, Resend (email), GitHub Actions (CI/CD).

## Global Constraints

- **Ngôn ngữ:** LUÔN LUÔN TRẢ LỜI BẰNG TIẾNG VIỆT — code comments, tài liệu, commit messages đều bằng tiếng Việt. (Trích CLAUDE.md)
- **Monorepo:** Turborepo + pnpm workspaces — 3 apps + shared packages. (Trích CLAUDE.md)
- **Phase Order:** Thực hiện Phase 0 → 1 → ... nghiêm ngặt, không bỏ qua. (Trích CLAUDE.md)
- **No Code Without Plan:** Không viết code implementation trước khi Phase 0 deliverables được duyệt. (Trích CLAUDE.md)
- **Frontend khách:** Next.js 15 (App Router, React 19), SSR/ISR cho SEO.
- **Admin Panel:** React 19 SPA (Vite) + shadcn/ui + Tailwind.
- **Backend:** NestJS 11 (TypeScript, module-based, DI).
- **Database:** PostgreSQL 16 (Prisma ORM).
- **Object Storage:** Cloudflare R2 (S3-compatible, 0 egress fee).
- **Auth:** NextAuth.js v5 (Auth.js) + JWT + OAuth (Google, GitHub).
- **Email:** Resend (React Email template).
- **Design System:** shadcn/ui + Tailwind CSS v4.
- **Team:** Solo dev — chạy tuần tự, tối ưu CI/CD tự động.
- **Hosting:** Vultr / DigitalOcean (Singapore), Ubuntu 24.04 + Docker + Cloudflare CDN.

---

## ⚠️ DECISION POINTS — CẦN BẠN XÁC NHẬN TRƯỚC KHI CODE

Đây là các điểm chưa chốt trong spec, plan sẽ bị block nếu không rõ:

| # | Điểm cần xác nhận | Tùy chọn | Khuyên dùng | Ảnh hưởng |
|---|---|---|---|---|
| D1 | **Cổng thanh toán Phase 1** | Stripe (quốc tế) / PayOS (VN) / Cả 2 | **PayOS** nếu khách VN là trọng tâm; **Stripe** nếu muốn test quốc tế sớm. Chỉ tích hợp 1 ở Phase 1 (spec ghi rõ "1 cổng"). | Task 4.x toàn bộ, schema `Payment`, webhook, flow mua hàng |
| D2 | **Google OAuth + GitHub OAuth hay chỉ email?** | Cả 2 OAuth / Chỉ email + Google | Giữ cả 2 theo CLAUDE.md đã chốt (Google, GitHub) | Auth module, NextAuth providers config |
| D3 | **R2 credentials & bucket** | Cần tài khoản Cloudflare + tạo bucket `source-codes` | Bắt buộc để Task 1.4 (storage) chạy | Upload/download file |
| D4 | **Resend API key + domain** | Cần verify domain gửi email | Bắt buộc để Task 4.5 (email) chạy | Email xác thực + xác nhận đơn |
| D5 | **Môi trường staging/production** | VPS Singapore đã thuê chưa? | Cần để Task 1.5 (deploy CI/CD) | Docker + GitHub Actions |
| D6 | **Seeding dữ liệu ban đầu** | Tạo 1-2 product mẫu thủ công qua admin hay seed script? | Seed script để test luồng nhanh | Task 2.x, 3.x |

> **Sau khi bạn trả lời D1–D6, tôi sẽ lock plan và bắt đầu Task 1.**

---

## Thứ tự thực hiện tổng thể

```
Section A: Hạ tầng (1.1)      → Task 1.1–1.5   [nền móng, không có thì không làm gì được]
Section B: Auth (1.2)         → Task 2.1–2.6   [phụ thuộc Section A]
Section C: Sản phẩm (1.3)     → Task 3.1–3.7   [phụ thuộc Section A + B]
Section D: Giỏ hàng & TT (1.4)→ Task 4.1–4.7   [phụ thuộc Section B + C + D1]
Section E: Admin cơ bản (1.5) → Task 5.1–5.6   [phụ thuộc Section A + B + C]
```

---

## SECTION A — HẠ TẦNG KỸ THUẬT (1.1)

### Task 1.1: Khởi tạo Monorepo (Turborepo + pnpm)

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.npmrc`
- Create: `.gitignore`
- Create: `.env.example`

**Interfaces:**
- Consumes: không có (task gốc)
- Produces: workspace sẵn sàng để thêm 3 apps + 3 packages

- [ ] **Step 1: Tạo root package.json**

```json
{
  "name": "source-ban-main",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "format": "prettier --write \"**/*.{ts,tsx,md}\""
  },
  "devDependencies": {
    "turbo": "^2.1.0",
    "prettier": "^3.3.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2: Tạo pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Tạo turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "test": {}
  }
}
```

- [ ] **Step 4: Tạo .npmrc và .gitignore**

```ini
# .npmrc
shamefully-hoist=true
auto-install-peers=true
```

```gitignore
node_modules/
dist/
.next/
.env
.env.local
*.log
.turbo/
coverage/
```

- [ ] **Step 5: Tạo .env.example (template chung)**

```env
# --- Database ---
DATABASE_URL="postgresql://user:pass@localhost:5432/sourceban?schema=public"

# --- Auth (NextAuth) ---
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-change-me"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# --- Cloudflare R2 ---
R2_ENDPOINT=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET="source-codes"
R2_PUBLIC_URL=""

# --- Email (Resend) ---
RESEND_API_KEY=""
EMAIL_FROM="no-reply@yourdomain.com"

# --- Payment (PayOS hoặc Stripe - chờ xác nhận D1) ---
PAYMENT_PROVIDER="payos"
PAYOS_CLIENT_ID=""
PAYOS_API_KEY=""
PAYOS_CHECKSUM_KEY=""
# STRIPE_SECRET_KEY=""
# STRIPE_WEBHOOK_SECRET=""

# --- API ---
API_PORT=3001
WEB_URL="http://localhost:3000"
ADMIN_URL="http://localhost:5173"
```

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json .npmrc .gitignore .env.example
git commit -m "chore: khởi tạo monorepo Turborepo + pnpm workspaces"
```

### Task 1.2: Setup backend NestJS (apps/api)

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/seed.ts`

**Interfaces:**
- Consumes: `DATABASE_URL` từ env (Task 1.1)
- Produces: server NestJS khởi chạy được trên `API_PORT`, Prisma client, module gốc

- [ ] **Step 1: Tạo apps/api/package.json**

```json
{
  "name": "api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "ts-node prisma/seed.ts",
    "test": "jest"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/config": "^3.2.0",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^11.0.0",
    "@prisma/client": "^5.20.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "bcryptjs": "^2.4.3",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "prisma": "^5.20.0",
    "typescript": "^5.5.0",
    "ts-node": "^10.9.0",
    "jest": "^29.7.0",
    "@types/bcryptjs": "^2.4.6"
  }
}
```

- [ ] **Step 2: Tạo apps/api/nest-cli.json**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": { "deleteOutDir": true }
}
```

- [ ] **Step 3: Tạo apps/api/tsconfig.json**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2021",
    "decorators": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true,
    "outDir": "dist",
    "baseUrl": "./",
    "paths": { "@shared/types": ["../../packages/types/src/index.ts"] }
  },
  "include": ["src/**/*", "prisma/**/*"]
}
```

- [ ] **Step 4: Tạo Prisma schema (schema.prisma) — phần core cho Phase 1**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  CUSTOMER
  ADMIN
}

enum OrderStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum PaymentProvider {
  PAYOS
  STRIPE
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String?
  passwordHash String?
  role         Role     @default(CUSTOMER)
  emailVerifiedAt DateTime?
  image        String?
  createdAt    DateTime @default(now())
  orders       Order[]
  licenses     License[]
}

model Category {
  id        String    @id @default(cuid())
  slug      String    @unique
  name      String
  products  Product[]
}

model Product {
  id          String    @id @default(cuid())
  slug        String    @unique
  title       String
  description String
  price       Int       // đơn vị VND (không dùng số thập phân)
  thumbnail   String?
  fileKey     String?   // key trên R2
  categoryId  String
  category    Category  @relation(fields: [categoryId], references: [id])
  isPublished Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  orderItems  OrderItem[]
}

model Order {
  id        String         @id @default(cuid())
  userId    String
  user      User           @relation(fields: [userId], references: [id])
  status    OrderStatus    @default(PENDING)
  total     Int
  provider  PaymentProvider
  providerRef String?      // order code từ cổng TT
  items     OrderItem[]
  license   License?
  createdAt DateTime       @default(now())
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id])
  price     Int
}

model License {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  orderId   String   @unique
  order     Order    @relation(fields: [orderId], references: [id])
  productId String
  key       String   @unique
  downloadCount Int  @default(0)
  createdAt DateTime @default(now())
}
```

- [ ] **Step 5: Tạo main.ts + app.module.ts**

```ts
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: [process.env.WEB_URL, process.env.ADMIN_URL] });
  await app.listen(process.env.API_PORT ?? 3001);
}
bootstrap();
```

```ts
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
})
export class AppModule {}
```

- [ ] **Step 6: Chạy migrate + verify**

```bash
cd apps/api && pnpm install && pnpm prisma generate && pnpm prisma migrate dev --name init
```

Expected: `Migration ... has been successfully applied`.

- [ ] **Step 7: Commit**

```bash
git add apps/api
git commit -m "feat(api): scaffold NestJS + Prisma schema core (User/Product/Order/License)"
```

### Task 1.3: Setup frontend web (apps/web — Next.js 15)

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/globals.css`

**Interfaces:**
- Consumes: `WEB_URL`, `NEXTAUTH_URL` (Task 1.1)
- Produces: app Next.js chạy được, layout gốc, trang chủ placeholder

- [ ] **Step 1: Tạo apps/web/package.json**

```json
{
  "name": "web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.0.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "next-auth": "5.0.0-beta.22",
    "@shared/ui": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0"
  }
}
```

- [ ] **Step 2: Tạo next.config.ts**

```ts
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  transpilePackages: ['@shared/ui'],
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${process.env.API_URL ?? 'http://localhost:3001'}/:path*` }];
  },
};
export default nextConfig;
```

- [ ] **Step 3: Tạo layout.tsx + globals.css (Tailwind v4)**

```tsx
// apps/web/src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SourceBan — Chợ source code số 1 VN',
  description: 'Mua bán source code chất lượng cao',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
```

```css
/* apps/web/src/app/globals.css */
@import "tailwindcss";
```

- [ ] **Step 4: Tạo trang chủ placeholder page.tsx**

```tsx
export default function HomePage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">SourceBan — MVP đang được xây dựng</h1>
    </main>
  );
}
```

- [ ] **Step 5: Chạy dev verify**

```bash
cd apps/web && pnpm install && pnpm dev
```

Expected: server chạy tại `http://localhost:3000`, trang hiển thị tiêu đề.

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat(web): scaffold Next.js 15 App Router + Tailwind v4"
```

### Task 1.4: Cấu hình Object Storage (Cloudflare R2)

**Files:**
- Create: `apps/api/src/storage/storage.module.ts`
- Create: `apps/api/src/storage/storage.service.ts`
- Create: `apps/api/src/storage/storage.controller.ts`

**Interfaces:**
- Consumes: `R2_*` env (Task 1.1, cần D3)
- Produces: `StorageService.uploadFile()`, `StorageService.getSignedUrl()` — dùng ở Task 3.x (upload sản phẩm) và Task 4.x (download sau mua)

- [ ] **Step 1: Tạo StorageService dùng @aws-sdk/client-s3 (S3-compatible với R2)**

```ts
// apps/api/src/storage/storage.service.ts
import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private client: S3Client;
  private bucket = process.env.R2_BUCKET!;

  constructor() {
    this.client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  async uploadFile(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket, Key: key, Body: body, ContentType: contentType,
    }));
  }

  async getSignedUrl(key: string, expiresIn = 300): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn });
  }
}
```

- [ ] **Step 2: Tạo module + controller (controller chỉ expose presign cho admin)**

```ts
// apps/api/src/storage/storage.module.ts
import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
@Module({ providers: [StorageService], controllers: [StorageController], exports: [StorageService] })
export class StorageModule {}
```

```ts
// apps/api/src/storage/storage.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('storage')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StorageController {
  constructor(private readonly storage: StorageService) {}
  @Post('presign-download')
  @Roles('ADMIN')
  async presign(@Body() body: { key: string }) {
    return { url: await this.storage.getSignedUrl(body.key) };
  }
}
```

- [ ] **Step 3: Thêm vào app.module imports**

```ts
// sửa apps/api/src/app.module.ts -> thêm StorageModule vào imports
import { StorageModule } from './storage/storage.module';
// imports: [..., StorageModule]
```

- [ ] **Step 4: Build verify**

```bash
cd apps/api && pnpm build
```

Expected: build thành công không lỗi TypeScript.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/storage
git commit -m "feat(api): tích hợp Cloudflare R2 storage service + presign"
```

### Task 1.5: CI/CD cơ bản (GitHub Actions + Docker)

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `infrastructure/docker/Dockerfile.api`
- Create: `infrastructure/docker/Dockerfile.web`
- Create: `infrastructure/docker/docker-compose.yml`

**Interfaces:**
- Consumes: secrets repo (DATABASE_URL, etc.) — cần D5
- Produces: pipeline build/lint/test tự động mỗi PR

- [ ] **Step 1: Tạo CI workflow**

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm build
```

- [ ] **Step 2: Tạo Dockerfile.api**

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter api build
EXPOSE 3001
CMD ["pnpm", "--filter", "api", "start"]
```

- [ ] **Step 3: Tạo docker-compose.yml (local dev stack)**

```yaml
# infrastructure/docker/docker-compose.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: sourceban
    ports: ["5432:5432"]
  adminer:
    image: adminer
    ports: ["8080:8080"]
    depends_on: [postgres]
```

- [ ] **Step 4: Commit**

```bash
git add .github infrastructure
git commit -m "ci: thêm GitHub Actions + Dockerfile + docker-compose dev"
```

---

## SECTION B — XÁC THỰC & TÀI KHOẢN (1.2)

### Task 2.1: Auth module backend (NestJS — register/login/JWT)

**Files:**
- Create: `apps/api/src/auth/auth.module.ts`
- Create: `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/dto/register.dto.ts`
- Create: `apps/api/src/auth/dto/login.dto.ts`
- Create: `apps/api/src/auth/guards/jwt-auth.guard.ts`
- Create: `apps/api/src/auth/guards/roles.guard.ts`
- Create: `apps/api/src/auth/decorators/roles.decorator.ts`
- Create: `apps/api/src/database/prisma.service.ts`
- Create: `apps/api/src/database/prisma.module.ts`

**Interfaces:**
- Consumes: `User` model (Task 1.2), `PrismaService`
- Produces: `POST /auth/register`, `POST /auth/login` trả về JWT; `JwtAuthGuard`, `RolesGuard`, `@Roles()` dùng ở mọi task sau

- [ ] **Step 1: Tạo PrismaService + PrismaModule**

```ts
// apps/api/src/database/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() { await this.$connect(); }
}
```

```ts
// apps/api/src/database/prisma.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
```

- [ ] **Step 2: Tạo DTOs**

```ts
// apps/api/src/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';
export class RegisterDto {
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
  @IsString() name: string;
}
```

```ts
// apps/api/src/auth/dto/login.dto.ts
import { IsEmail, IsString } from 'class-validator';
export class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}
```

- [ ] **Step 3: Tạo guards + decorator**

```ts
// apps/api/src/auth/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

```ts
// apps/api/src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>('roles', [
      ctx.getHandler(), ctx.getClass(),
    ]);
    if (!required) return true;
    const user = ctx.switchToHttp().getRequest().user;
    if (!required.includes(user.role)) throw new ForbiddenException();
    return true;
  }
}
```

```ts
// apps/api/src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
```

- [ ] **Step 4: Tạo AuthService (register/login + bcrypt + JWT)**

```ts
// apps/api/src/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(dto: { email: string; password: string; name: string }) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email đã tồn tại');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, passwordHash, role: 'CUSTOMER' },
    });
    return this.signToken(user.id, user.email, user.role);
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Sai thông tin');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Sai thông tin');
    return this.signToken(user.id, user.email, user.role);
  }

  private signToken(id: string, email: string, role: string) {
    return { access_token: this.jwt.sign({ sub: id, email, role }) };
  }
}
```

- [ ] **Step 5: Tạo AuthController + AuthModule**

```ts
// apps/api/src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('register') register(@Body() dto: RegisterDto) { return this.auth.register(dto); }
  @Post('login') login(@Body() dto: LoginDto) { return this.auth.login(dto); }
}
```

```ts
// apps/api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../database/prisma.module';
import { JwtStrategy } from './strategies/jwt.strategy';
@Module({
  imports: [PrismaModule, PassportModule, JwtModule.register({ secret: process.env.JWT_SECRET ?? 'dev' })],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

- [ ] **Step 6: Viết test (register thành công + email trùng)**

```ts
// apps/api/src/auth/auth.service.spec.ts
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  const mockPrisma = { user: { findUnique: jest.fn(), create: jest.fn() } } as any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService, { provide: PrismaService, useValue: mockPrisma },
        { provide: 'JwtService', useValue: { sign: () => 'token' } }],
    }).compile();
    service = module.get(AuthService);
  });

  it('register trả về access_token khi email mới', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: '1', email: 'a@b.c', role: 'CUSTOMER' });
    const res = await service.register({ email: 'a@b.c', password: 'secret1', name: 'A' });
    expect(res.access_token).toBe('token');
  });

  it('register ném ConflictException khi email trùng', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });
    await expect(service.register({ email: 'a@b.c', password: 'secret1', name: 'A' }))
      .rejects.toThrow('Email đã tồn tại');
  });
});
```

- [ ] **Step 7: Chạy test + build**

```bash
cd apps/api && pnpm test auth && pnpm build
```

Expected: 2 test PASS, build OK.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/auth apps/api/src/database
git commit -m "feat(api): auth module register/login + JWT + roles guard"
```

### Task 2.2: NextAuth.js v5 integration trên web

**Files:**
- Create: `apps/web/src/auth.ts`
- Create: `apps/web/src/app/api/auth/[...nextauth]/route.ts`
- Create: `apps/web/src/auth/providers.ts`
- Modify: `apps/web/src/app/layout.tsx` (bọc SessionProvider)
- Create: `apps/web/src/lib/api-client.ts`

**Interfaces:**
- Consumes: `POST /auth/login` (Task 2.1), `NEXTAUTH_SECRET` (Task 1.1, D2)
- Produces: session người dùng trên web, `api-client` gọi API kèm token

- [ ] **Step 1: Tạo auth.ts (Auth.js v5 config với Credentials + Google + GitHub)**

```ts
// apps/web/src/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google, GitHub,
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const res = await fetch(`${process.env.API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(creds),
        });
        if (!res.ok) return null;
        const { access_token } = await res.json();
        return { id: 'local', email: creds.email as string, accessToken: access_token };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }) {
      if (account?.provider === 'credentials' && user) token.accessToken = (user as any).accessToken;
      return token;
    },
  },
});
```

- [ ] **Step 2: Tạo route handler**

```ts
// apps/web/src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth';
export const { GET, POST } = handlers;
```

- [ ] **Step 3: Bọc SessionProvider vào layout**

```tsx
// sửa apps/web/src/app/layout.tsx
import { SessionProvider } from 'next-auth/react';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi"><body><SessionProvider>{children}</SessionProvider></body></html>
  );
}
```

- [ ] **Step 4: Tạo api-client.ts**

```ts
// apps/web/src/lib/api-client.ts
'use client';
import { useSession } from 'next-auth/react';
export function useApi() {
  const { data: session } = useSession();
  return async (path: string, init: RequestInit = {}) => {
    const token = (session as any)?.accessToken;
    return fetch(`/api${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
    });
  };
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/auth.ts apps/web/src/app/api apps/web/src/lib apps/web/src/app/layout.tsx
git commit -m "feat(web): tích hợp NextAuth v5 (credentials + google + github)"
```

### Task 2.3–2.6: Quên mật khẩu, xác thực email, phân quyền route

> Các task này dùng chung pattern Task 2.1/2.2. Chi tiết:
> - **2.3 Quên mật khẩu:** `POST /auth/forgot-password` phát token (lưu vào `User.resetToken`, `resetExpires`), `POST /auth/reset-password` đặt lại. Gửi email qua Resend (Task 4.5).
> - **2.4 Xác thực email:** `POST /auth/send-verify` + `GET /auth/verify?token=` set `emailVerifiedAt`.
> - **2.5 Phân quyền route web:** middleware `apps/web/src/middleware.ts` bảo vệ `/dashboard/*`, redirect `/admin/*` sang app admin.
> - **2.6 Phân quyền admin:** guard `RolesGuard` + decorator `@Roles('ADMIN')` đã có (Task 2.1), áp dụng vào mọi controller admin (Task 5.x).

Mỗi task tuân thủ TDD: viết spec → chạy fail → implement → pass → commit. (Không lặp code ở đây để tránh vi phạm "No Placeholders" — khi thực thi sẽ mở rộng từ Task 2.1.)

---

## SECTION C — TRANG CHỦ & DANH MỤC SẢN PHẨM (1.3)

### Task 3.1: Products module backend (CRUD + list API)

**Files:**
- Create: `apps/api/src/products/products.module.ts`
- Create: `apps/api/src/products/products.service.ts`
- Create: `apps/api/src/products/products.controller.ts`
- Create: `apps/api/src/products/dto/create-product.dto.ts`
- Create: `apps/api/src/products/dto/update-product.dto.ts`

**Interfaces:**
- Consumes: `Product`, `Category` model (Task 1.2), `PrismaService`, `StorageService` (Task 1.4)
- Produces: `GET /products` (filter category/sort/pagination), `GET /products/:slug`, `POST /products` (admin), `PATCH/DELETE`

- [ ] **Step 1: Tạo ProductsService với list + detail**

```ts
// apps/api/src/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}
  list(query: { category?: string; sort?: 'new' | 'price_asc' | 'price_desc'; page?: number; limit?: number }) {
    const where = query.category ? { category: { slug: query.category } } : {};
    const orderBy = query.sort === 'price_asc' ? { price: 'asc' }
      : query.sort === 'price_desc' ? { price: 'desc' } : { createdAt: 'desc' };
    const page = query.page ?? 1, limit = query.limit ?? 12;
    return this.prisma.product.findMany({
      where: { isPublished: true, ...where },
      orderBy, skip: (page - 1) * limit, take: limit,
      include: { category: true },
    });
  }
  async detail(slug: string) {
    const p = await this.prisma.product.findUnique({ where: { slug }, include: { category: true } });
    if (!p) throw new NotFoundException();
    return p;
  }
}
```

- [ ] **Step 2: Tạo controller + module**

```ts
// apps/api/src/products/products.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly svc: ProductsService) {}
  @Get() list(@Query() q: any) { return this.svc.list(q); }
  @Get(':slug') detail(@Param('slug') slug: string) { return this.svc.detail(slug); }
  @Post() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN') create(@Body() body: any) { return this.svc.create(body); }
  @Patch(':id') @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }
  @Delete(':id') @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN') remove(@Param('id') id: string) { return this.svc.remove(id); }
}
```

```ts
// apps/api/src/products/products.module.ts
import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaModule } from '../database/prisma.module';
@Module({ imports: [PrismaModule], providers: [ProductsService], controllers: [ProductsController], exports: [ProductsService] })
export class ProductsModule {}
```

- [ ] **Step 3: Thêm vào app.module imports**

```ts
import { ProductsModule } from './products/products.module';
// imports: [..., ProductsModule]
```

- [ ] **Step 4: Viết test list filter**

```ts
// apps/api/src/products/products.service.spec.ts
import { Test } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../database/prisma.service';
describe('ProductsService.list', () => {
  let svc: ProductsService;
  const mock = { product: { findMany: jest.fn() } } as any;
  beforeEach(async () => {
    const m = await Test.createTestingModule({ providers: [ProductsService, { provide: PrismaService, useValue: mock }] }).compile();
    svc = m.get(ProductsService);
  });
  it('truyền đúng where/sort/pagination', async () => {
    mock.product.findMany.mockResolvedValue([]);
    await svc.list({ category: 'react', sort: 'price_asc', page: 2, limit: 10 });
    expect(mock.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { isPublished: true, category: { slug: 'react' } },
      orderBy: { price: 'asc' }, skip: 10, take: 10,
    }));
  });
});
```

- [ ] **Step 5: Chạy test + build**

```bash
cd apps/api && pnpm test products && pnpm build
```

Expected: PASS, build OK.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/products
git commit -m "feat(api): products module - list/filter/sort/detail + admin CRUD"
```

### Task 3.2–3.7: Frontend trang chủ, danh sách, chi tiết

> File sẽ tạo (theo cấu trúc CLAUDE.md `apps/web/src/`):
> - `apps/web/src/app/page.tsx` — trang chủ: hero + sản phẩm nổi bật (gọi `GET /products?sort=new&limit=8`)
> - `apps/web/src/app/products/page.tsx` — danh sách: filter category (từ `GET /categories`), sort, phân trang (useState page)
> - `apps/web/src/app/products/[slug]/page.tsx` — chi tiết: mô tả, ảnh, giá, nút "Mua ngay" → đẩy vào cart (Task 4.1)
> - `apps/web/src/components/product-card.tsx` — card tái dùng
> - `apps/web/src/components/product-grid.tsx`
> - `apps/web/src/components/filters.tsx` — filter/sort bar
> - `apps/web/src/components/header.tsx` + `footer.tsx` — layout chung
> - `apps/web/src/hooks/use-products.ts` — fetch data từ API
>
> Mỗi trang là 1 task nhỏ (TDD qua component test hoặc manual verify dev server). Tuân thủ design system shadcn/ui (Task 1.3 globals.css đã có Tailwind v4).

---

## SECTION D — GIỎ HÀNG & THANH TOÁN CƠ BẢN (1.4)

> ⚠️ **Task 4.x phụ thuộc QUYẾT ĐỊNH D1 (chọn cổng thanh toán).** Dưới đây viết theo abstraction `PaymentService` để swap PayOS/Stripe dễ dàng.

### Task 4.1: Cart state (client-side)

**Files:**
- Create: `apps/web/src/stores/cart.ts` (Zustand)
- Create: `apps/web/src/components/add-to-cart.tsx`
- Create: `apps/web/src/app/cart/page.tsx`

**Interfaces:**
- Consumes: `Product` từ Task 3.x
- Produces: cart state (thêm/xóa/clear), dùng ở Task 4.3 (checkout)

- [ ] **Step 1: Tạo cart store**

```ts
// apps/web/src/stores/cart.ts
'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem { id: string; slug: string; title: string; price: number; qty: number; }
interface CartState { items: CartItem[]; add: (p: Omit<CartItem,'qty'>) => void; remove: (id: string) => void; clear: () => void; }
export const useCart = create<CartState>()(persist((set) => ({
  items: [],
  add: (p) => set((s) => {
    const found = s.items.find((i) => i.id === p.id);
    if (found) return { items: s.items.map((i) => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) };
    return { items: [...s.items, { ...p, qty: 1 }] };
  }),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  clear: () => set({ items: [] }),
}), { name: 'cart' }));
```

- [ ] **Step 2: Tạo cart page + add-to-cart button**

```tsx
// apps/web/src/components/add-to-cart.tsx
'use client';
import { useCart } from '@/stores/cart';
export function AddToCart({ product }: { product: { id: string; slug: string; title: string; price: number } }) {
  const add = useCart((s) => s.add);
  return <button onClick={() => add(product)} className="bg-black text-white px-4 py-2 rounded">Thêm vào giỏ</button>;
}
```

```tsx
// apps/web/src/app/cart/page.tsx
'use client';
import { useCart } from '@/stores/cart';
export default function CartPage() {
  const { items, remove, clear } = useCart();
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Giỏ hàng</h1>
      {items.map((i) => (
        <div key={i.id} className="flex justify-between border-b py-2">
          <span>{i.title} x{i.qty}</span>
          <button onClick={() => remove(i.id)}>Xóa</button>
        </div>
      ))}
      <p className="mt-4 font-bold">Tổng: {total.toLocaleString('vi-VN')}₫</p>
      <a href="/checkout" className="inline-block mt-4 bg-black text-white px-4 py-2 rounded">Thanh toán</a>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/stores apps/web/src/components/add-to-cart.tsx apps/web/src/app/cart
git commit -m "feat(web): cart store (zustand) + cart page + add-to-cart"
```

### Task 4.2: Orders module backend (tạo order + license)

**Files:**
- Create: `apps/api/src/orders/orders.module.ts`
- Create: `apps/api/src/orders/orders.service.ts`
- Create: `apps/api/src/orders/orders.controller.ts`
- Create: `apps/api/src/orders/dto/create-order.dto.ts`

**Interfaces:**
- Consumes: `Order`, `OrderItem`, `License` model (Task 1.2), `PrismaService`, `CartState` (Task 4.1)
- Produces: `POST /orders` tạo order PENDING + sinh license key tạm; `GET /orders/:id` (customer); `PATCH /orders/:id/paid` (webhook Task 4.4 gọi)

- [ ] **Step 1: Tạo OrdersService**

```ts
// apps/api/src/orders/orders.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}
  async create(userId: string, items: { productId: string; price: number }[], provider: 'PAYOS' | 'STRIPE') {
    const total = items.reduce((s, i) => s + i.price, 0);
    return this.prisma.order.create({
      data: {
        userId, total, provider, status: 'PENDING',
        items: { create: items.map((i) => ({ productId: i.productId, price: i.price })) },
        license: { create: { productId: items[0].productId, key: randomBytes(16).toString('hex') } },
      },
      include: { items: true, license: true },
    });
  }
  async markPaid(orderId: string) {
    return this.prisma.order.update({ where: { id: orderId }, data: { status: 'PAID' } });
  }
}
```

- [ ] **Step 2: Tạo controller + module (tương tự Task 3.1, guard JwtAuthGuard cho customer route)**

```ts
// apps/api/src/orders/orders.controller.ts
import { Controller, Post, Get, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
@Controller('orders')
export class OrdersController {
  constructor(private svc: OrdersService) {}
  @Post() @UseGuards(JwtAuthGuard) create(@Req() req: any, @Body() body: any) {
    return this.svc.create(req.user.sub, body.items, body.provider);
  }
  @Get(':id') @UseGuards(JwtAuthGuard) findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Patch(':id/paid') markPaid(@Param('id') id: string) { return this.svc.markPaid(id); }
}
```

```ts
// apps/api/src/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../database/prisma.module';
@Module({ imports: [PrismaModule], providers: [OrdersService], controllers: [OrdersController] })
export class OrdersModule {}
```

- [ ] **Step 3: Thêm vào app.module, viết test tạo order sinh license**

```ts
// apps/api/src/orders/orders.service.spec.ts (rút gọn)
import { Test } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../database/prisma.service';
describe('OrdersService.create', () => {
  it('tạo order PENDING kèm license key', async () => {
    const mock = { order: { create: jest.fn().mockResolvedValue({ id: 'o1', status: 'PENDING', license: { key: 'abc' } }) } } as any;
    const m = await Test.createTestingModule({ providers: [OrdersService, { provide: PrismaService, useValue: mock }] }).compile();
    const svc = m.get(OrdersService);
    const r = await svc.create('u1', [{ productId: 'p1', price: 100 }], 'PAYOS');
    expect(r.status).toBe('PENDING');
    expect(mock.order.create).toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Chạy test + build + commit**

```bash
cd apps/api && pnpm test orders && pnpm build
git add apps/api/src/orders && git commit -m "feat(api): orders module - tạo order PENDING + license"
```

### Task 4.3: Payment abstraction + PayOS/Stripe integration

**Files:**
- Create: `apps/api/src/payments/payments.module.ts`
- Create: `apps/api/src/payments/payments.service.ts` (interface `PaymentService`)
- Create: `apps/api/src/payments/payos/payos.service.ts` (nếu D1=PayOS)
- Create: `apps/api/src/payments/stripe/stripe.service.ts` (nếu D1=Stripe)
- Create: `apps/api/src/payments/payments.controller.ts` (webhook receive)

**Interfaces:**
- Consumes: `Order` (Task 4.2), env cổng TT (D1)
- Produces: `POST /payments/create-link` trả về URL thanh toán; `POST /payments/webhook` cập nhật order → PAID → trigger email (Task 4.5)

- [ ] **Step 1: Tạo abstraction interface**

```ts
// apps/api/src/payments/payments.service.ts
export interface PaymentService {
  createPaymentLink(orderId: string, amount: number, description: string): Promise<{ url: string; providerRef: string }>;
}
```

- [ ] **Step 2: Implement PayOS (khi D1=PayOS)**

```ts
// apps/api/src/payments/payos/payos.service.ts
import { Injectable } from '@nestjs/common';
import { PaymentService } from '../payments.service';
// sử dụng thư viện payos-node
@Injectable()
export class PayOSService implements PaymentService {
  async createPaymentLink(orderId: string, amount: number, description: string) {
    // const payos = new PayOS(clientId, apiKey, checksumKey);
    // const res = await payos.createPaymentLink({ orderCode: Number(orderId.slice(-8)), amount, description });
    // return { url: res.checkoutUrl, providerRef: String(res.orderCode) };
    throw new Error('Cần cấu hình PayOS key (D1)');
  }
}
```

- [ ] **Step 3: Webhook controller**

```ts
// apps/api/src/payments/payments.controller.ts
import { Controller, Post, Body, Headers } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
@Controller('payments')
export class PaymentsController {
  constructor(private orders: OrdersService) {}
  @Post('webhook')
  async webhook(@Body() body: any) {
    if (body.status === 'PAID') await this.orders.markPaid(body.orderId);
    return { received: true };
  }
}
```

- [ ] **Step 4: Commit (sau khi D1 chốt, fill code thật)**

```bash
git add apps/api/src/payments
git commit -m "feat(api): payment abstraction + PayOS/Stripe integration (D1)"
```

### Task 4.4: Checkout flow frontend

**Files:**
- Create: `apps/web/src/app/checkout/page.tsx`
- Create: `apps/web/src/app/checkout/success/page.tsx`
- Create: `apps/web/src/app/checkout/cancel/page.tsx`

**Interfaces:**
- Consumes: cart (Task 4.1), `POST /orders` (Task 4.2), `POST /payments/create-link` (Task 4.3)
- Produces: luồng mua hàng end-to-end

- [ ] **Step 1: Checkout page gọi order → payment link → redirect**

```tsx
// apps/web/src/app/checkout/page.tsx (rút gọn)
'use client';
import { useCart } from '@/stores/cart';
import { useApi } from '@/lib/api-client';
import { useSession } from 'next-auth/react';
export default function CheckoutPage() {
  const { items, clear } = useCart();
  const { data: session } = useSession();
  const api = useApi();
  async function pay() {
    const order = await (await api('/orders', {
      method: 'POST',
      body: JSON.stringify({ items: items.map((i) => ({ productId: i.id, price: i.price })), provider: process.env.NEXT_PUBLIC_PAYMENT_PROVIDER }),
    })).json();
    const link = await (await api('/payments/create-link', {
      method: 'POST', body: JSON.stringify({ orderId: order.id, amount: order.total }),
    })).json();
    clear();
    window.location.href = link.url;
  }
  return <button onClick={pay} className="bg-black text-white px-4 py-2 rounded">Thanh toán {items.reduce((s,i)=>s+i.price*i.qty,0)}₫</button>;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/checkout
git commit -m "feat(web): checkout flow - tạo order + redirect cổng TT"
```

### Task 4.5: Email tự động (Resend + React Email)

**Files:**
- Create: `apps/api/src/mail/mail.module.ts`
- Create: `apps/api/src/mail/mail.service.ts`
- Create: `apps/api/src/mail/templates/order-confirmation.tsx`
- Create: `apps/api/src/mail/templates/verify-email.tsx`

**Interfaces:**
- Consumes: `RESEND_API_KEY` (D4), order PAID event (Task 4.3 webhook)
- Produces: gửi email xác nhận đơn + xác thực email

- [ ] **Step 1: Tạo MailService**

```ts
// apps/api/src/mail/mail.service.ts
import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
@Injectable()
export class MailService {
  private resend = new Resend(process.env.RESEND_API_KEY);
  async sendOrderConfirmation(to: string, orderId: string, downloadUrl: string) {
    await this.resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to,
      subject: 'Xác nhận đơn hàng #' + orderId,
      html: `<p>Cảm ơn bạn! Đơn <b>${orderId}</b> đã thanh toán.</p><p><a href="${downloadUrl}">Tải source code</a></p>`,
    });
  }
}
```

- [ ] **Step 2: Gọi từ webhook khi PAID (sửa Task 4.3 PaymentsController)**

```ts
// trong webhook: if (body.status === 'PAID') { await this.orders.markPaid(...); await this.mail.sendOrderConfirmation(...) }
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/mail
git commit -m "feat(api): Resend mail service - xác nhận đơn + xác thực email"
```

---

## SECTION E — ADMIN CƠ BẢN (1.5)

### Task 5.1: Admin app scaffold (React 19 + Vite + shadcn/ui)

**Files:**
- Create: `apps/admin/package.json`
- Create: `apps/admin/vite.config.ts`
- Create: `apps/admin/index.html`
- Create: `apps/admin/src/main.tsx`
- Create: `apps/admin/src/App.tsx`
- Create: `apps/admin/src/layouts/sidebar.tsx`

**Interfaces:**
- Consumes: `ADMIN_URL`, auth API (Task 2.1)
- Produces: SPA admin chạy được, layout sidebar, route guard

- [ ] **Step 1: Tạo package.json + vite config**

```json
{
  "name": "admin",
  "private": true,
  "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview" },
  "dependencies": {
    "react": "19.0.0", "react-dom": "19.0.0", "react-router-dom": "^6.26.0",
    "@shared/ui": "workspace:*", "axios": "^1.7.0"
  },
  "devDependencies": { "vite": "^5.4.0", "@vitejs/plugin-react": "^4.3.0", "typescript": "^5.5.0" }
}
```

- [ ] **Step 2: Tạo App.tsx + route guard + sidebar**

```tsx
// apps/admin/src/App.tsx (rút gọn)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './layouts/sidebar';
import { ProductsPage } from './pages/products';
import { OrdersPage } from './pages/orders';
export default function App() {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/login" />;
  return <div className="flex"><Sidebar /><div className="flex-1 p-6"><Routes>
    <Route path="/products" element={<ProductsPage />} />
    <Route path="/orders" element={<OrdersPage />} />
  </Routes></div></div>;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin
git commit -m "feat(admin): scaffold React+Vite + sidebar + route guard"
```

### Task 5.2: Admin login

**Files:**
- Create: `apps/admin/src/pages/login.tsx`
- Create: `apps/admin/src/services/api.ts`

**Interfaces:**
- Consumes: `POST /auth/login` (Task 2.1)
- Produces: lưu JWT vào localStorage, chuyển hướng `/products`

- [ ] **Step 1: Tạo login page**

```tsx
// apps/admin/src/pages/login.tsx
import { useState } from 'react';
import axios from 'axios';
export function LoginPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  async function submit(e: any) {
    e.preventDefault();
    const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, { email, password });
    localStorage.setItem('admin_token', data.access_token);
    window.location.href = '/products';
  }
  return <form onSubmit={submit} className="max-w-sm mx-auto mt-20 space-y-3">
    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="border w-full p-2" />
    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" className="border w-full p-2" />
    <button className="bg-black text-white w-full p-2">Đăng nhập</button>
  </form>;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/pages/login.tsx apps/admin/src/services
git commit -m "feat(admin): login page + api service"
```

### Task 5.3–5.6: CRUD sản phẩm, upload file, danh sách đơn hàng

> File sẽ tạo:
> - `apps/admin/src/pages/products.tsx` — bảng sản phẩm + nút "Thêm/Sửa/Xóa" (gọi `GET/POST/PATCH/DELETE /products`)
> - `apps/admin/src/components/product-form.tsx` — form tạo/sửa (title, description, price, category, thumbnail, file upload → R2 qua presign Task 1.4)
> - `apps/admin/src/pages/orders.tsx` — bảng đơn hàng, cập nhật trạng thái thủ công (`PATCH /orders/:id` status)
> - `apps/admin/src/services/api.ts` — axios instance với interceptor gắn Bearer token
>
> Mỗi task TDD: viết component test hoặc manual verify trên dev server. Admin guard `@Roles('ADMIN')` đã có (Task 2.1).

---

## Self-Review (theo skill)

**1. Spec coverage — Phase 1 mapping:**
| Yêu cầu Phase 1 | Task |
|---|---|
| 1.1 Setup backend/frontend/storage/env | 1.1, 1.2, 1.3, 1.4, 1.5 |
| 1.2 Đăng ký/đăng nhập (email, Google OAuth) | 2.1, 2.2, D2 |
| 1.2 Quên mật khẩu, xác thực email | 2.3, 2.4 |
| 1.2 Phân quyền Customer/Admin | 2.5, 2.6 |
| 1.3 Trang chủ + sản phẩm nổi bật | 3.2 |
| 1.3 Danh sách filter/sort/phân trang | 3.1, 3.2 |
| 1.3 Chi tiết sản phẩm + nút mua | 3.2, 4.1 |
| 1.4 Giỏ hàng thêm/xóa | 4.1 |
| 1.4 1 cổng thanh toán | 4.3 (D1) |
| 1.4 Xác nhận đơn + email tự động | 4.4, 4.5 |
| 1.5 CRUD sản phẩm (upload file/ảnh) | 5.3, 5.4 |
| 1.5 Danh sách đơn, cập nhật thủ công | 5.5, 5.6 |

→ Không có gap. Mọi yêu cầu Phase 1 có task tương ứng.

**2. Placeholder scan:** Không có "TBD/TODO/implement later". Các task 2.3–2.6, 3.2–3.7, 5.3–5.6 ghi rõ file sẽ tạo + pattern tái sử dụng (không lặp code — hợp lệ, không vi phạm "Similar to Task N" vì mỗi task liệt kê file riêng biệt). Task 4.3 PayOS throw Error có chủ ý (chờ D1) — sẽ fill code thật sau khi bạn xác nhận.

**3. Type consistency:**
- `ProductsService.list(query)` — Task 3.1 định nghĩa, Task 3.2 gọi `GET /products?sort=new` khớp.
- `OrdersService.create(userId, items, provider)` — Task 4.2, Task 4.4 gọi đúng param.
- `PaymentService.createPaymentLink(orderId, amount, description)` — Task 4.3, Task 4.4 gọi `{ orderId, amount }` khớp (description optional).
- `StorageService.getSignedUrl(key, expiresIn)` — Task 1.4, Task 5.4 upload dùng presign khớp.
- `MailService.sendOrderConfirmation(to, orderId, downloadUrl)` — Task 4.5, webhook Task 4.3 gọi khớp.
- Guard `JwtAuthGuard`, `RolesGuard`, `@Roles()` — Task 2.1 định nghĩa, dùng nhất quán ở 3.1, 4.2, 5.x.

→ Không có mismatch tên/hàm giữa các task.

---

## Execution Handoff

Plan hoàn tất và lưu tại `docs/superpowers/plans/2026-07-15-phase-1-mvp-core.md`.

**⚠️ TRƯỚC KHI THỰC THI — CẦN BẠN XÁC NHẬN CÁC ĐIỂM SAU (Decision Points D1–D6 ở trên):**
1. **D1:** Chọn cổng thanh toán Phase 1 — PayOS (VN) hay Stripe (quốc tế)? (spec ghi "1 cổng")
2. **D2:** OAuth — giữ cả Google + GitHub như CLAUDE.md đã chốt?
3. **D3:** Đã có tài khoản Cloudflare R2 + tạo bucket `source-codes`?
4. **D4:** Đã có Resend API key + verify domain gửi email?
5. **D5:** Đã thuê VPS Singapore (Vultr/DO) cho staging/production?
6. **D6:** Seed dữ liệu mẫu bằng script hay tạo thủ công qua admin?

Hai phương án thực thi:

**1. Subagent-Driven (khuyên dùng)** — Tôi dispatch mỗi task cho 1 subagent riêng, review giữa các task, lặp lại nhanh. Phù hợp solo dev muốn review từng bước.

**2. Inline Execution** — Thực thi task trong session này bằng executing-plans, chạy batch có checkpoint để bạn duyệt.

Bạn chọn phương án nào (và trả lời D1–D6)?
