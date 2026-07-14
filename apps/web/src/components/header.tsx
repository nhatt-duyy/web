import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 px-3 py-4 sm:px-6">
          <div className="flex flex-1 items-center justify-center sm:justify-start">
            <Link href="/" className="text-xl font-semibold text-indigo-600 hover:text-indigo-500">
              SourceBan
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end sm:hidden">
            {/* Mobile menu button - placeholder */}
            <button className="px-2 py-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              Menu
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-end">
            <nav className="flex space-x-4">
              <Link href="/" className="text-gray-500 hover:text-gray-900">
                Trang chủ
              </Link>
              <Link href="/products" className="text-gray-500 hover:text-gray-900">
                Sản phẩm
              </Link>
              <Link href="/about" className="text-gray-500 hover:text-gray-900">
                Về chúng tôi
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end sm:mt-0 sm:ml-4">
            {status === 'loading' ? (
              <div className="text-gray-400 animate-spin">Loading</div>
            ) : status === 'authenticated' ? (
              <>
                <span className="mr-4 text-gray-600">
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
              <>
                <button
                  onClick={() => signIn('google', { callbackUrl: '/' })}
                  className="mr-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Đăng nhập với Google
                </button>
                <button
                  onClick={() => signIn('credentials', { callbackUrl: '/' })}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Đăng nhập
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}