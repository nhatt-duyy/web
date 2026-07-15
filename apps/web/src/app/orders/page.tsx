'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useApi } from '@/lib/api-client';
import { Container, Spinner, Badge, EmptyState } from '@/components/ui/primitives';
import { ShoppingBagIcon, ArrowRightIcon } from '@/components/ui/icons';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const statusTone = (status?: string): 'success' | 'danger' | 'warning' | 'soft' => {
  if (status === 'PAID' || status === 'CONFIRMED') return 'success';
  if (status === 'CANCELLED' || status === 'FAILED') return 'danger';
  return 'warning';
};

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated') {
      const callbackUrl = encodeURIComponent('/orders');
      router.push(`/api/auth/signin?callbackUrl=${callbackUrl}`);
      return;
    }
    fetchOrders();
  }, [status, api, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api('/orders/mine', { method: 'GET' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Không thể lấy danh sách đơn hàng');
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      setOrders(list);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <>
        <Header />
        <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center px-4 py-12">
          <Spinner className="h-8 w-8" />
          <p className="mt-4 text-muted">Đang tải đơn hàng...</p>
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
            <span className="text-foreground">Đơn hàng</span>
          </nav>

          <h1 className="mb-8 text-3xl font-bold tracking-tight sm:text-4xl">Đơn hàng của tôi</h1>

          {error ? (
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger">{error}</div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={<ShoppingBagIcon className="h-7 w-7" />}
              title="Chưa có đơn hàng nào"
              description="Khi bạn mua source code, đơn hàng sẽ hiển thị tại đây."
              action={
                <Link
                  href="/products"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-white transition-all hover:-translate-y-px hover:bg-primary-strong"
                >
                  Khám phá sản phẩm <ArrowRightIcon className="h-5 w-5" />
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const items = Array.isArray(order.items) ? order.items : [];
                const count = items.reduce((sum: number, it: any) => sum + (it.qty || 1), 0);
                const date = order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  : '';
                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-display text-base font-semibold">Đơn #{order.id}</p>
                        <p className="mt-0.5 text-sm text-muted">
                          {date}
                          {count > 0 && ` · ${count} sản phẩm`}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-lg font-bold">{formatPrice(order.total || 0)}</span>
                        <Badge tone={statusTone(order.status)}>{order.status}</Badge>
                      </div>
                    </div>
                    {items.length > 0 && (
                      <ul className="mt-4 space-y-2 border-t border-border pt-4">
                        {items.slice(0, 4).map((it: any, i: number) => (
                          <li key={i} className="flex items-center justify-between gap-3 text-sm">
                            <span className="truncate text-muted">
                              {it.product?.title || it.title || `Sản phẩm #${it.productId}`}
                            </span>
                            <span className="shrink-0 font-mono text-foreground">x{it.qty || 1}</span>
                          </li>
                        ))}
                        {items.length > 4 && (
                          <li className="text-xs text-muted">+{items.length - 4} sản phẩm khác</li>
                        )}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
