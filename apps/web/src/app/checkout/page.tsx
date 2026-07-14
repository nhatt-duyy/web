'use client';

import { useCartStore } from '@/lib/cart-store';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useApi } from '@/lib/api-client';

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items } = useCartStore();
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      return;
    }
    if (status === 'loading') {
      return;
    }
    // Not authenticated
    // Redirect to sign-in page with callback to current page
    const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search);
    router.push(`/api/auth/signin?callbackUrl=${callbackUrl}`);
  }, [status, router]);

  // Calculate total amount
  const totalAmount = items.reduce(
    (sum, item) => sum + (item.price || 0) * (item.qty || 0),
    0
  );

  const handleCheckout = async () => {
    if (!items || items.length === 0) {
      setError('Giỏ hàng của bạn đang trống');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create order
      const orderResponse = await api('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.id,
            qty: item.qty,
          })),
          // provider is optional; we can omit or set to 'PAYOS'
          // We'll omit and let backend decide (maybe default to something else)
          // According to the contract, provider is optional and defaults to null?
          // We'll not send it.
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Không thể tạo đơn hàng');
      }

      const orderData = await orderResponse.json();
      const orderId = orderData.id;

      // Step 2: Create PayOS payment link
      const paymentResponse = await api('/payments/payos/create', {
        method: 'POST',
        body: JSON.stringify({
          orderId: orderId,
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.message || 'Không thể tạo liên kết thanh toán');
      }

      const paymentData = await paymentResponse.json();
      const checkoutUrl = paymentData.checkoutUrl;

      // Redirect to PayOS
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi trong quá trình thanh toán');
    } finally {
      setLoading(false);
    }
  };

  // Render loading state while checking session
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

  // If not authenticated, show redirect message
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

  // If cart is empty, show empty cart message
  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center px-4 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Giỏ hàng trống</h2>
            <p className="mb-6">
              Hãy thêm sản phẩm vào giỏ hàng trước khi thanh toán.
            </p>
            <a
              href="/products"
              className="btn-primary px-6 py-3"
            >
              Tiếp tục mua sắm
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Otherwise, show checkout form
  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-10rem)]">
        <aside className="w-1/4 border-r py-8">
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Giỏ hàng của bạn</h3>
              <p className="text-sm text-gray-500">
                {items.reduce((sum, item) => sum + item.qty, 0)} mục
              </p>
              <p className="mt-2 font-medium">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(totalAmount)}
              </p>
            </div>
          </div>
        </aside>

        <div className="flex-1 p-8">
          <h1 className="mb-6 text-2xl font-bold">Thanh toán</h1>

          {/* Cart items list */}
          <div className="mb-8">
            <h2 className="mb-4 font-semibold">Sản phẩm trong giỏ hàng</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 flex">
                  <img
                    src={item.thumbnail || '/placeholder.svg'}
                    alt={item.title}
                    className="w-24 h-24 object-cover mr-4"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-500">
                      Số lượng: {item.qty}
                    </p>
                    <p className="mt-2 font-medium">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(item.price || 0)}
                      × {item.qty} =
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format((item.price || 0) * item.qty)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order summary */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="mb-4 font-semibold">Tóm tắt đơn hàng</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span>
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold">Tổng cộng:</span>
                <span className="font-bold text-lg">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Checkout button */}
          <div>
            <button
              onClick={handleCheckout}
              disabled={loading || items.length === 0}
              className="btn-primary w-full px-8 py-3 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M6 18l2 2 4-4M18 12l-2-2-4-4m2 2l-2 2-4-4M12 4v14m0 0l2-2-2-2m2 2l2-2-2-2"></path></svg>
                  Thanh toán ngay
                </>
              )}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}