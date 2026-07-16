'use client';

import { useCartStore } from '@/lib/cart-store';
import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import ThemeToggle from '@/components/ui/theme-toggle';
import SearchBar from '@/components/search-bar';
import { CartIcon, MenuIcon, CloseIcon, ArrowRightIcon, ShoppingBagIcon, UserIcon } from '@/components/ui/icons';

const NAV = [
  { href: '/', label: 'Trang chủ' },
  { href: '/products', label: 'Sản phẩm' },
  { href: '/du-an', label: 'Dự án' },
  { href: '/bao-gia', label: 'Báo giá' },
  { href: '/blog', label: 'Blog' },
  { href: '/products?sortBy=price&sortOrder=asc', label: 'Giá tốt' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href.split('?')[0] && href !== '/';
}

function Logo() {
  return (
    <Link
      href="/"
      className="group flex shrink-0 items-center gap-2.5 font-display text-lg font-bold tracking-tight text-foreground"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-strong text-sm font-bold text-white shadow-[0_8px_20px_-8px_var(--glow)] ring-1 ring-white/10 transition-transform duration-200 group-hover:-translate-y-0.5">
        {'</>'}
      </span>
      <span>
        Source<span className="text-gradient">Ban</span>
      </span>
    </Link>
  );
}

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.totalItems());
  const [mobileOpen, setMobileOpen] = useState(false);

  const initial = (session?.user?.name ?? session?.user?.email ?? 'B')
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="glass mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl px-3 py-2.5 sm:px-5 sm:py-3">
        <Logo />

        {/* Desktop search */}
        <SearchBar className="hidden w-full max-w-sm flex-1 px-2 md:block" />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary-soft text-primary'
                    : 'text-muted hover:bg-surface-2 hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <ThemeToggle className="hidden sm:inline-flex" />

          <Link
            href="/cart"
            aria-label={`Giỏ hàng${cartCount > 0 ? `, ${cartCount} sản phẩm` : ''}`}
            className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border text-muted transition-colors hover:border-primary hover:text-foreground"
          >
            <CartIcon className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-white shadow-[0_4px_10px_-4px_var(--glow)]">
                {cartCount}
              </span>
            )}
          </Link>

          {status === 'loading' ? (
            <span className="hidden h-10 w-24 animate-pulse-soft rounded-xl bg-surface-2 sm:block" />
          ) : status === 'authenticated' ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/dashboard"
                aria-label="Bảng điều khiển"
                className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border text-muted transition-colors hover:border-primary hover:text-foreground"
              >
                <UserIcon className="h-5 w-5" />
              </Link>
              <Link
                href="/orders"
                aria-label="Đơn hàng của tôi"
                className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border text-muted transition-colors hover:border-primary hover:text-foreground"
              >
                <ShoppingBagIcon className="h-5 w-5" />
              </Link>
              <span
                className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-strong text-sm font-semibold text-white ring-1 ring-white/10"
                title={session?.user?.name ?? session?.user?.email ?? 'Tài khoản'}
                aria-hidden="true"
              >
                {initial}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="cursor-pointer rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn(undefined, { callbackUrl: '/' })}
              className="hidden cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_var(--glow)] transition-all hover:bg-primary-strong hover:-translate-y-px sm:inline-flex"
            >
              Đăng nhập
            </button>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={mobileOpen}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border text-muted transition-colors hover:border-primary hover:text-foreground md:hidden"
          >
            {mobileOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="glass mx-auto mt-2 max-w-7xl rounded-2xl p-3 md:hidden">
          <div className="px-1 pb-2">
            <SearchBar />
          </div>
          <nav className="flex flex-col" aria-label="Điều hướng di động">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'rounded-xl px-3 py-3 text-base font-medium transition-colors',
                    active
                      ? 'bg-primary-soft text-primary'
                      : 'text-muted hover:bg-surface-2 hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            {status === 'authenticated' && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-base font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                >
                  <UserIcon className="h-5 w-5" /> Bảng điều khiển
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-base font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                >
                  <ShoppingBagIcon className="h-5 w-5" /> Đơn hàng của tôi
                </Link>
              </>
            )}
          </nav>
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {status === 'authenticated' && (
                <span className="text-sm text-muted">{session?.user?.name ?? 'Tài khoản'}</span>
              )}
            </div>
            {status === 'authenticated' ? (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  signOut({ callbackUrl: '/' });
                }}
                className="cursor-pointer rounded-xl px-3 py-2 text-sm font-medium text-muted hover:text-foreground"
              >
                Đăng xuất
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  signIn(undefined, { callbackUrl: '/' });
                }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Đăng nhập <ArrowRightIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
