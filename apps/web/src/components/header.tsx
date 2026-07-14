'use client';

import { useCartStore } from '@/lib/cart-store';
import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const cartStore = useCartStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const cartCount = cartStore.totalItems();

  return (
    <header className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 px-3 py-4 sm:px-6">
          {/* Logo */}
          <div className="flex flex-1 items-center justify-center sm:justify-start">
            <Link href="/" className="text-xl font-semibold text-indigo-600 hover:text-indigo-500">
              SourceBan
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex flex-1 items-center justify-end sm:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="px-2 py-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {/* Hamburger icon */}
              <svg className="h-5 w-5" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Desktop nav links, cart, and auth */}
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-end">
            {/* Nav links */}
            <nav className="flex space-x-4 mr-6">
              <Link
                href="/"
                className={pathname === '/' ? 'text-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-900'}
              >
                Trang chủ
              </Link>
              <Link
                href="/products"
                className={pathname === '/products' ? 'text-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-900'}
              >
                Sản phẩm
              </Link>
            </nav>

            {/* Cart and Auth */}
            <div className="flex items-center gap-4">
              {/* Cart link */}
              <Link href="/cart" className="relative">
                <svg className="h-5 w-5 text-gray-600 hover:text-gray-900" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13H5.4m5 6L7 7m3 4v1m-6.231 1.89A6 6 0 014.11 8h0a6 6 0 017.6-3.2 6 6 0 011.153 5.824l-.686.289a6 6 0 01-.998.356A6 6 0 0112 13a6 6 0 01-6 6 6 6 0 01-6-6 6 6 0 016-6z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Auth */}
              {status === 'loading' ? (
                <div className="text-gray-400 animate-spin">Loading</div>
              ) : status === 'authenticated' ? (
                <>
                  <span className="text-gray-600 mr-2">
                    Xin chào, {session?.user?.name ?? 'Người dùng'}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <button
                  onClick={() => signIn('credentials', { callbackUrl: '/' })}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Đăng nhập
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu (when open) */}
        {mobileOpen && (
          <div className="lg:hidden mt-4 px-3">
            <nav className="flex flex-col space-y-2">
              <Link
                href="/"
                className={pathname === '/' ? 'text-indigo-600 font-medium block px-3 py-2 rounded' : 'text-gray-500 hover:text-gray-900 block px-3 py-2 rounded'}
              >
                Trang chủ
              </Link>
              <Link
                href="/products"
                className={pathname === '/products' ? 'text-indigo-600 font-medium block px-3 py-2 rounded' : 'text-gray-500 hover:text-gray-900 block px-3 py-2 rounded'}
              >
                Sản phẩm
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}