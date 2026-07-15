'use client';

import { useCartStore } from '@/lib/cart-store';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useApi } from '@/lib/api-client';
import { Container, Spinner, EmptyState } from '@/components/ui/primitives';
import { CheckIcon, ShieldIcon, LockIcon, ArrowRightIcon, CartIcon } from '@/components/ui/icons';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items } = useCartStore();
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') return;
    if (status === 'loading') return;
    const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search);
    router.push(`/api/auth/signin?callbackUrl=${callbackUrl}`);
  }, [status, router]);

  const totalAmount = items.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 0), 0);

  const handleCheckout = async () => {
    if (!items || items.length === 0) {
      setError('Giỏ hàng của bạn đang trống');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const orderResponse = await api('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.id, qty: item.qty })),
        }),
      });
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Không thể tạo đơn hàng');
      }
      const orderData = await orderResponse.json();
      const orderId = orderData.id;

      const paymentResponse = await api('/payments/payos/create', {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      });
      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.message || 'Không thể tạo liên kết thanh toán');
      }
      const paymentData = await paymentResponse.json();
      window.location.href = paymentData.checkoutUrl;
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi trong quá trình thanh toán');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <>
        <Header />
        <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center px-4 py-12">
          <Spinner className="h-8 w-8" />
          <p className="mt-4 text-muted">Đang kiểm tra trạng thái đăng nhập...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (status !== 'authenticated') {
    return (
      <>
        <Header />
        <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center px-4 py-12">
          <p className="text-muted">Đang chuyển hướng đến trang đăng nhập...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="py-10">
          <Container>
            <EmptyState
              icon={<CartIcon className="h-7 w-7" />}
              title="Giỏ hàng trống"
              description="Hãy thêm sản phẩm vào giỏ hàng trước khi thanh toán."
              action={
                <Link
                  href="/products"
                  className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:bg-primary-strong"
                >
                  Tiếp tục mua sắm
                </Link>
              }
            />
          </Container>
        </main>
        <Footer />
      </>
    );
  }

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
            <Link href="/cart" className="transition-colors hover:text-primary">
              Giỏ hàng
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">Thanh toán</span>
          </nav>

          <h1 className="mb-8 text-3xl font-bold tracking-tight sm:text-4xl">Thanh toán</h1>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Items */}
            <div>
              <h2 className="mb-4 font-display text-lg font-semibold">Sản phẩm trong giỏ hàng</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                      {item.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-2">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-medium">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted">Số lượng: {item.qty}</p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-semibold">
                      {formatPrice((item.price || 0) * item.qty)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary + pay */}
            <aside className="lg:sticky lg:top-24">
              <div className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="mb-4 font-display text-lg font-semibold">Tóm tắt đơn hàng</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted">
                    <span>Tạm tính</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                    <span>Tổng cộng</span>
                    <span className="font-mono">{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white shadow-[0_12px_30px_-12px_var(--glow)] transition-all hover:-translate-y-px hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Spinner className="h-5 w-5" /> Đang xử lý...
                    </>
                  ) : (
                    <>
                      <LockIcon className="h-5 w-5" /> Thanh toán an toàn
                    </>
                  )}
                </button>

                <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
                  <ShieldIcon className="h-4 w-4 text-primary" /> Thanh toán được bảo mật bởi PayOS
                </p>
              </div>

              <Link
                href="/cart"
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-sm text-muted transition-colors hover:text-primary"
              >
                <ArrowRightIcon className="h-4 w-4 rotate-180" /> Quay lại giỏ hàng
              </Link>
            </aside>
          </div>

          {error && (
            <div className="mx-auto mt-6 max-w-xl rounded-xl border border-danger/30 bg-danger/10 p-4 text-center text-danger">
              {error}
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
