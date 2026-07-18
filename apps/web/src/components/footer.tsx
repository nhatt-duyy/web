import Link from 'next/link';
import ThemeToggle from '@/components/ui/theme-toggle';
import { Container } from '@/components/ui/primitives';
import { CodeIcon, GithubIcon } from '@/components/ui/icons';

const NAV_LINKS = [
  { label: 'Sản phẩm', href: '/products' },
  { label: 'Dự án', href: '/du-an' },
  { label: 'Báo giá', href: '/bao-gia' },
  { label: 'Blog', href: '/blog' },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <Container className="py-14">
        {/* Statement: tuyên bố ngắn thay vì 4 cột link rỗng */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-strong text-sm font-bold text-white">
                {'</>'}
              </span>
              Source<span className="text-primary">Ban</span>
            </Link>
            <p className="mt-5 text-balance text-lg font-medium leading-relaxed text-foreground">
              Chợ source code và dịch vụ phát triển phần mềm cho developer Việt — tải về, triển
              khai, và bàn giao dự án mà không phải làm lại từ đầu.
            </p>
          </div>

          <nav aria-label="Liên kết chân trang" className="flex flex-wrap gap-x-7 gap-y-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-muted transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-2">
            &copy; {new Date().getFullYear()} Nhat Duy Market. Mọi quyền được bảo lưu.
          </p>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub của Nhat Duy Market"
              className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted transition-colors hover:border-primary hover:text-foreground"
            >
              <GithubIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

