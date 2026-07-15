import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  transpilePackages: ['@shared/ui'],
  images: {
    // Cho phép next/image tải ảnh từ Cloudflare R2 (và mọi CDN https).
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  async rewrites() {
    return [
      // NextAuth routes are handled by this Next.js app itself — must NOT be proxied to the backend API
      { source: '/api/auth/:path*', destination: '/api/auth/:path*' },
      // Proxy all other /api/* calls to the NestJS backend
      { source: '/api/:path*', destination: `${process.env.API_URL ?? 'http://localhost:3001'}/:path*` },
    ];
  },
};
export default nextConfig;
