'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useApi } from '@/lib/api-client';
import { useCartStore } from '@/lib/cart-store';
import { Container, Spinner } from '@/components/ui/primitives';
import { CheckIcon, ShieldIcon, ArrowRightIcon, ShoppingBagIcon } from '@/components/ui/icons';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const statusTone = (status?: string) => {
  if (status === 'PAID' || status === 'CONFIRMED') return 'bg-success/15 text-success';
  if (status === 'CANCELLED' || status === 'FAILED') return 'bg-danger/15 text-danger';
  return 'bg-warning/15 text-warning';
};

export default function CheckoutReturnPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (status !== 'authenticated') {
      const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/api/auth/signin?callbackUrl=${callbackUrl}`);
      return;
    }

    const query = new URLSearchParams(window.location.search);
    const orderCode = query.get('orderCode');
    const orderId = query.get('orderId');

    if (orderId) {
      fetchOrderById(orderId);
      return;
    }
    if (orderCode) {
      fetchOrderByCode(orderCode);
      return;
    }
    setMessage('Thanh toán đã được xử lý. Vui lòng kiểm tra email để xem xác nhận đơn hàng.');
    setLoading(false);
  }, [status, api, router]);

  const fetchOrderById = async (id: string) => {
    try {
      setLoading(true);
      const res = await api(`/orders/${id}`, { method: 'GET' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Không thể lấy thông tin đơn hàng');
      }
      const data = await res.json();
      setOrder(data);
      setMessage(`Thanh toán thành công! Đơn hàng #${data.id} đã được xác nhận.`);
      useCartStore.getState().clear();
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi lấy thông tin đơn hàng');
      setMessage('Không thể lấy chi tiết đơn hàng, nhưng thanh toán có thể đã thành công.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderByCode = async (code: string) => {
    try {
      setLoading(true);
      const res = await api(`/orders/mine`, { method: 'GET' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Không thể lấy danh sách đơn hàng');
      }
      const data = await res.json();
      const orders = Array.isArray(data) ? data : data.data || [];
      const matchedOrder = orders.find((o: any) => o.providerRef === code);
      if (matchedOrder) {
        setOrder(matchedOrder);
        setMessage(`Thanh toán thành công! Đơn hàng #${matchedOrder.id} đã được xác nhận.`);
        useCartStore.getState().clear();
      } else {
        setMessage('Đã nhận được thông báo thanh toán từ PayOS. Đơn hàng của bạn đang được xử lý.');
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi kiểm tra trạng thái thanh toán');
      setMessage('Không thể xác nhận trạng thái đơn hàng, nhưng thanh toán có thể đã thành công.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <>
        <Header />
        <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center px-4 py-12">
          <Spinner className="h-10 w-10" />
          <p className="mt-4 text-muted">Đang xử lý kết quả thanh toán...</p>
        </main>
        <Footer />
      </>
    );
  }

  const isSuccess = !!order;

  return (
    <>
      <Header />
      <main className="py-16">
        <Container>
          <div className="mx-auto max-w-xl">
            <div className="text-center">
              <div
                className={`mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl ${
                  isSuccess ? 'bg-success/15 text-success' : 'bg-primary-soft text-primary'
                }`}
              >
                <CheckIcon className="h-8 w-8" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isSuccess ? 'Thanh toán thành công!' : 'Đang xử lý đơn hàng'}
              </h1>
              <p className="mt-4 text-muted">{message}</p>
            </div>

            {order && (
              <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
                <div className="flex items-center justify-between py-3">
                  <span className="text-muted">Mã đơn hàng</span>
                  <span className="font-medium">#{order.id}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border py-3">
                  <span className="text-muted">Tổng tiền</span>
                  <span className="font-mono font-semibold">{formatPrice(order.total || 0)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border py-3">
                  <span className="text-muted">Trạng thái</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/orders"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-white shadow-[0_12px_30px_-12px_var(--glow)] transition-all hover:-translate-y-px hover:bg-primary-strong"
              >
                <ShoppingBagIcon className="h-5 w-5" /> Xem đơn hàng
              </Link>
              <Link
                href="/products"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-border-strong px-6 font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary-soft"
              >
                Tiếp tục mua sắm <ArrowRightIcon className="h-5 w-5" />
              </Link>
            </div>

            {error && <p className="mt-6 text-center text-sm text-danger">{error}</p>}

            <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted">
              <ShieldIcon className="h-4 w-4 text-primary" /> Thanh toán được bảo mật bởi PayOS
            </p>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
