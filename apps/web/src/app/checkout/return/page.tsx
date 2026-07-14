'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useApi } from '@/lib/api-client';

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
      // Redirect to login if not authenticated
      const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/api/auth/signin?callbackUrl=${callbackUrl}`);
      return;
    }

    // Get query parameters from URL
    const query = new URLSearchParams(window.location.search);
    const orderCode = query.get('orderCode');
    const orderId = query.get('orderId');

    // If we have orderId, we can fetch the order directly
    if (orderId) {
      fetchOrderById(orderId);
      return;
    }

    // If we have orderCode, we need to find the order by orderCode.
    // We don't have a direct endpoint, but we'll fetch the user's orders and filter.
    if (orderCode) {
      // We'll try to find the order by checking recent orders of the user.
      // This is not efficient but works for now.
      fetchOrderByCode(orderCode);
      return;
    }

    // No query params, just show a generic success message.
    setMessage('Thanh toán đã được xử lý. Vui lòng kiểm tra email để xem xác nhận đơn hàng.');
    setLoading(false);
  }, [status, api, router]);

  const fetchOrderById = async (id: string) => {
    try {
      setLoading(true);
      const res = await api(`/orders/${id}`, {
        method: 'GET',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Không thể lấy thông tin đơn hàng');
      }

      const data = await res.json();
      setOrder(data);
      setMessage(`Thanh toán thành công! Đơn hàng #${data.id} đã được xác nhận.`);
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
      // We'll fetch the user's orders and try to find one with matching providerRef (orderCode)
      // Since we don't have an endpoint for this, we'll fetch the user's orders and filter.
      const res = await api(`/orders/mine`, {
        method: 'GET',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Không thể lấy danh sách đơn hàng');
      }

      const data = await res.json();
      // Assuming data is an array of orders
      const orders = Array.isArray(data) ? data : data.data || [];
      const matchedOrder = orders.find((order: any) => order.providerRef === code);
      if (matchedOrder) {
        setOrder(matchedOrder);
        setMessage(`Thanh toán thành công! Đơn hàng #${matchedOrder.id} đã được xác nhận.`);
      } else {
        // If not found, show a generic message
        setMessage('Đã nhận được thông báo thanh toán từ PayOS. Đơn hàng của bạn đang được xử lý.');
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi kiểm tra trạng thái thanh toán');
      setMessage('Không thể xác nhận trạng thái đơn hàng, nhưng thanh toán có thể đã thành công.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <>
        <Header />
        <div className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4">Đang kiểm tra trạng thái đăng nhập...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (status !== 'authenticated') {
    return (
      <>
        <Header />
        <div className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center px-4 py-12">
          <div className="text-center">
            <p>Đang chuyển hướng đến trang đăng nhập...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center max-w-xl">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p>Đang xử lý kết quả thanh toán...</p>
            </>
          ) : (
            <>
              {order ? (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-green-600">
                    Thêm thanh toán thành công!
                  </h2>
                  <div className="space-y-4 text-left">
                    <div>
                      <span className="font-bold">Đơn hàng:</span> #{order.id}
                    </div>
                    <div>
                      <span className="font-bold">Tổng tiền:</span> {' '}
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(order.total || 0)}
                    </div>
                    <div>
                      <span className="font-bold">Trạng thái:</span> {' '}
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        order.status === 'PAID' || order.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <a
                    href="/orders"
                    className="mt-6 inline-block btn-primary px-6 py-3"
                  >
                    Xem tất cả đơn hàng
                  </a>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-4">
                    {message || 'Đang xử lý kết quả thanh toán...'}
                  </h2>
                  {error ? (
                    <p className="text-red-600 mb-4">{error}</p>
                  ) : null}
                  <div className="space-y-4">
                    <a
                      href="/orders"
                      className="inline-block btn-outline px-6 py-3"
                    >
                      Xem đơn hàng của tôi
                    </a>
                    <a
                      href="/products"
                      className="inline-btn btn-primary px-6 py-3"
                    >
                      Tiếp tục mua sắm
                    </a>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}