// apps/web/src/app/api/register/route.ts
// Proxy đăng ký sang backend NestJS. Đặt ở /api/register (không phải /api/auth/*)
// để tránh xung đột với catch-all NextAuth tại /api/auth/[...nextauth].
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const res = await fetch(`${process.env.API_URL ?? 'http://localhost:3001'}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
