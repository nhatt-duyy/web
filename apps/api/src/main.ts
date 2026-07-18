// apps/api/src/main.ts
import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

// Sentry — khởi tạo sớm nhất có thể (chỉ init nếu có DSN).
// DSN lấy từ env (process.env.SENTRY_DSN), KHÔNG hardcode secret.
if (process.env.SENTRY_DSN) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Sentry = require('@sentry/nestjs');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0.2,
    // Bắt lỗi unhandled promise / exception
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: [process.env.WEB_URL, process.env.ADMIN_URL].filter(Boolean) as string[] });

  // Enable raw body extraction for webhook signature verification (PayOS).
  // bodyParser:false ở trên đảm bảo middleware này chạy TRƯỚC route handler.
  app.use(express.json({ verify: (req, res, buffer) => {
    (req as any).rawBody = buffer.toString();
  } }));
  app.use(express.urlencoded({ extended: true }));

  await app.listen(process.env.API_PORT ?? 3001);
}

bootstrap().catch((err) => {
  // Ghi log + báo Sentry (nếu đã init) khi khởi động thất bại
  // eslint-disable-next-line no-console
  console.error('Bootstrap failed:', err);
  if (process.env.SENTRY_DSN) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@sentry/nestjs').captureException(err);
    } catch {
      /* noop */
    }
  }
  process.exit(1);
});
