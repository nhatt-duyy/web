// apps/web/src/components/auth-shell.tsx
// Layout chung cho các trang xác thực (login / register):
// split-screen — brand panel bên trái (desktop) + form panel bên phải.
import Link from 'next/link';
import { CodeIcon, ShieldIcon, DownloadIcon, SparklesIcon } from '@/components/ui/icons';

const FEATURES = [
  { icon: CodeIcon, title: 'Source code chuẩn dev', desc: 'Tài liệu rõ ràng, dễ tùy biến.' },
  { icon: ShieldIcon, title: 'Giao dịch an toàn', desc: 'Bảo mật bởi PayOS, minh bạch.' },
  { icon: DownloadIcon, title: 'Tải ngay sau thanh toán', desc: 'Nhận file tức thì, không chờ đợi.' },
  { icon: SparklesIcon, title: 'Được kiểm duyệt kỹ', desc: 'Chỉ kinh doanh code chất lượng cao.' },
];

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* Left — brand showcase */}
      <aside className="relative hidden overflow-hidden bg-[#07080c] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-display text-lg font-bold text-white"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-strong text-sm font-bold text-white shadow-[0_8px_20px_-8px_var(--glow)] ring-1 ring-white/10">
              {'</>'}
            </span>
            <span>
              Source<span className="text-gradient">Ban</span>
            </span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-balance font-display text-4xl font-bold leading-tight tracking-tight text-white">
            Kho source code <span className="text-gradient">xịn</span> cho dev Việt.
          </h1>
          <p className="mt-4 text-muted-2">
            Mua bán source code chất lượng cao, triển khai nhanh dự án thực tế. Cộng đồng hàng nghìn
            lập trình viên tin dùng.
          </p>
          <ul className="mt-8 space-y-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-primary ring-1 ring-white/10">
                  <f.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-muted-2">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-muted-2">© 2026 SourceBan · Được bảo mật bởi PayOS</p>
      </aside>

      {/* Right — form panel */}
      <main className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          {/* Brand trên mobile */}
          <Link
            href="/"
            className="mb-8 flex items-center justify-center gap-2.5 font-display text-lg font-bold text-foreground lg:hidden"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-strong text-sm font-bold text-white shadow-[0_8px_20px_-8px_var(--glow)] ring-1 ring-white/10">
              {'</>'}
            </span>
            <span>
              Source<span className="text-gradient">Ban</span>
            </span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
