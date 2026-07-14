// apps/api/src/main.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: [process.env.WEB_URL, process.env.ADMIN_URL] });

  // Enable raw body extraction for webhook verification
  app.use(express.json({ verify: (req, res, buffer) => {
    (req as any).rawBody = buffer.toString();
  } }));

  await app.listen(process.env.API_PORT ?? 3001);
}
bootstrap();
