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
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="relative">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 font-display text-lg font-bold text-white"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-sm font-bold text-white ring-1 ring-white/15">
              {'</>'}
            </span>
            <span>Nhat Duy Market</span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-balance font-display text-4xl font-bold leading-tight tracking-tight text-white">
            Kho source code <span className="text-primary">chuẩn dev</span> cho người Việt.
          </h1>
          <p className="mt-4 text-muted-2">
            Mua bán source code chất lượng cao, triển khai nhanh dự án thực tế. Cộng đồng hàng nghìn
            lập trình viên tin dùng.
          </p>
          <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-3 py-4">
                <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-muted-2">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-muted-2">© 2026 Nhat Duy Market · Được bảo mật bởi PayOS</p>
      </aside>

      {/* Right — form panel */}
      <main className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          {/* Brand trên mobile */}
          <Link
            href="/"
            className="mb-8 flex items-center justify-center gap-2.5 font-display text-lg font-bold text-foreground lg:hidden"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-sm font-bold text-white ring-1 ring-white/15">
              {'</>'}
            </span>
            <span>Nhat Duy Market</span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
