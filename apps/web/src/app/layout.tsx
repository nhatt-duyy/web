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
