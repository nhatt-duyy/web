// apps/web/src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';

export const metadata: Metadata = {
  title: 'SourceBan — Chợ source code số 1 VN',
  description: 'Mua bán source code chất lượng cao',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <html lang="vi">
        <body>{children}</body>
      </html>
    </SessionProvider>
  );
}