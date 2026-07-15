import Link from 'next/link';
import ThemeToggle from '@/components/ui/theme-toggle';
import { Container } from '@/components/ui/primitives';
import { CodeIcon, ShieldIcon, BoltIcon, HeartIcon, GithubIcon } from '@/components/ui/icons';

const GROUPS = [
  {
    title: 'Sản phẩm',
    links: [
      { label: 'Tất cả source', href: '/products' },
      { label: 'Mới nhất', href: '/products?sortBy=createdAt&sortOrder=desc' },
      { label: 'Giá tốt', href: '/products?sortBy=price&sortOrder=asc' },
    ],
  },
  {
    title: 'Dịch vụ',
    links: [
      { label: 'Thuê developer', href: '/products' },
      { label: 'Tùy chỉnh theo yêu cầu', href: '/products' },
      { label: 'Bảo trì & hỗ trợ', href: '/products' },
    ],
  },
  {
    title: 'Công ty',
    links: [
      { label: 'Giới thiệu', href: '/' },
      { label: 'Liên hệ', href: '/' },
      { label: 'Điều khoản', href: '/' },
    ],
  },
];

const HIGHLIGHTS = [
  { icon: CodeIcon, label: 'Source chuẩn dev' },
  { icon: ShieldIcon, label: 'Thanh toán an toàn' },
  { icon: BoltIcon, label: 'Tải ngay sau mua' },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface/40">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-strong text-sm font-bold text-white shadow-[0_8px_20px_-8px_var(--glow)]">
                {'</>'}
              </span>
              Source<span className="text-gradient">Ban</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Chợ source code & dịch vụ phát triển phần mềm số 1 Việt Nam. Tải ngay, thanh toán
              an toàn, hỗ trợ tận tâm từ đội ngũ developer.
            </p>
            <ul className="mt-5 space-y-2.5">
              {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm text-muted">
                  <Icon className="h-4 w-4 text-primary" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Link groups */}
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-4 text-sm font-semibold text-foreground">{group.title}</h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-sm text-muted-2">
            &copy; {new Date().getFullYear()} SourceBan. Mọi quyền được bảo lưu.
          </p>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub của SourceBan"
              className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted transition-colors hover:border-primary hover:text-foreground"
            >
              <GithubIcon className="h-4 w-4" />
            </a>
            <span className="flex items-center gap-1.5 text-xs text-muted-2">
              <HeartIcon className="h-3.5 w-3.5 text-danger" /> Được xây dựng tại Việt Nam
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
