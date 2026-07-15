'use client';

import { useCartStore } from '@/lib/cart-store';
import { useShallow } from 'zustand/react/shallow';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Link from 'next/link';
import { Container, EmptyState } from '@/components/ui/primitives';
import { CartIcon, PlusIcon, MinusIcon, TrashIcon, ArrowRightIcon, ShieldIcon } from '@/components/ui/icons';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function CartPage() {
  const { items, updateQty, removeItem } = useCartStore(
    useShallow((s) => ({
      items: s.items,
      updateQty: s.updateQty,
      removeItem: s.removeItem,
    })),
  );
  const router = useRouter();

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const count = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <>
      <Header />
      <main className="py-10">
        <Container>
          <nav className="mb-3 flex items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-primary">
              Trang chủ
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">Giỏ hàng</span>
          </nav>

          <h1 className="mb-8 text-3xl font-bold tracking-tight sm:text-4xl">Giỏ hàng</h1>

          {items.length === 0 ? (
            <EmptyState
              icon={<CartIcon className="h-7 w-7" />}
              title="Giỏ hàng trống"
              description="Hãy đi mua sắm để thêm source code vào giỏ hàng của bạn."
              action={
                <Link
                  href="/products"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-white transition-all hover:-translate-y-px hover:bg-primary-strong"
                >
                  Tiếp tục mua sắm <ArrowRightIcon className="h-5 w-5" />
                </Link>
              }
            />
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              {/* Items */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-border-strong"
                  >
                    <Link
                      href={`/products/${item.slug}`}
                      className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-2"
                    >
                      {item.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-2">
                          No img
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="truncate font-medium">
                          <Link href={`/products/${item.slug}`} className="transition-colors hover:text-primary">
                            {item.title}
                          </Link>
                        </h3>
                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label="Xóa sản phẩm"
                          className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <p className="mt-1 font-mono text-sm text-muted">{formatPrice(item.price)}</p>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1 rounded-xl border border-border">
                          <button
                            onClick={() => updateQty(item.id, Math.max(0, item.qty - 1))}
                            aria-label="Giảm số lượng"
                            className="grid h-9 w-9 cursor-pointer place-items-center rounded-l-xl text-foreground transition-colors hover:bg-surface-2"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <span className="w-9 text-center text-sm font-medium">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.id, item.qty + 1)}
                            aria-label="Tăng số lượng"
                            className="grid h-9 w-9 cursor-pointer place-items-center rounded-r-xl text-foreground transition-colors hover:bg-surface-2"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="font-mono font-semibold">{formatPrice(item.price * item.qty)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <aside className="lg:sticky lg:top-24">
                <div className="rounded-2xl border border-border bg-surface p-6">
                  <h2 className="mb-4 font-display text-lg font-semibold">Tóm tắt đơn hàng</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-muted">
                      <span>{count} sản phẩm</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                      <span>Tổng cộng</span>
                      <span className="font-mono">{formatPrice(total)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/checkout')}
                    className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white shadow-[0_12px_30px_-12px_var(--glow)] transition-all hover:-translate-y-px hover:bg-primary-strong"
                  >
                    Thanh toán <ArrowRightIcon className="h-5 w-5" />
                  </button>
                  <Link
                    href="/products"
                    className="mt-3 block text-center text-sm text-muted transition-colors hover:text-primary"
                  >
                    Tiếp tục mua sắm
                  </Link>
                </div>

                <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
                  <ShieldIcon className="h-4 w-4 text-primary" /> Thanh toán được bảo mật bởi PayOS
                </p>
              </aside>
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
