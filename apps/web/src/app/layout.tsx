// apps/web/src/app/layout.tsx
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { SessionProvider } from 'next-auth/react';
import { Sora, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

const plexSans = IBM_Plex_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-sans',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://sourceban.com'),
  title: {
    default: 'SourceBan — Chợ source code & dịch vụ dev số 1 Việt Nam',
    template: '%s · SourceBan',
  },
  description:
    'SourceBan là chợ source code chất lượng cao và dịch vụ phát triển phần mềm. Tải ngay, thanh toán an toàn qua PayOS, hỗ trợ tận tâm.',
  keywords: [
    'source code',
    'mua source code',
    'bán source code',
    'web source code',
    'dịch vụ lập trình',
    'thuê dev',
    'NestJS',
    'Next.js',
    'React',
  ],
  authors: [{ name: 'SourceBan' }],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://sourceban.com',
    siteName: 'SourceBan',
    title: 'SourceBan — Chợ source code & dịch vụ dev số 1 Việt Nam',
    description:
      'Mua bán source code chất lượng cao và dịch vụ phát triển phần mềm. Thanh toán an toàn, hỗ trợ tận tâm.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SourceBan — Chợ source code & dịch vụ dev số 1 Việt Nam',
    description: 'Mua bán source code chất lượng cao và dịch vụ phát triển phần mềm.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f7f9' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0b0f' },
  ],
  width: 'device-width',
  initialScale: 1,
};

const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    var d = t ? t === 'dark' : true;
    document.documentElement.classList.toggle('dark', d);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <html lang="vi" suppressHydrationWarning className={`${sora.variable} ${plexSans.variable} ${jetbrains.variable}`}>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        </head>
        <body>{children}</body>
      </html>
    </SessionProvider>
  );
}
