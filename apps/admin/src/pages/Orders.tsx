import { useState, useEffect } from 'react';
import apiClient from '../lib/api-client';

type Product = { id: string; title: string; thumbnail: string };
type OrderItem = { id: string; orderId: string; productId: string; price: number; product: Product };
type User = { id: string; email: string; name: string };
type Order = {
  id: string;
  userId: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  total: number;
  provider: string;
  providerRef: string;
  createdAt: string;
  items: OrderItem[];
  user: User;
};
type PaginatedResponse = { data: Order[]; total: number; page: number; limit: number };

const statusStyles: Record<Order['status'], string> = {
  PENDING: 'border-warning/30 bg-warning/10 text-warning',
  PAID: 'border-success/30 bg-success/10 text-success',
  FAILED: 'border-danger/30 bg-danger-soft text-danger',
  REFUNDED: 'border-border bg-surface-2 text-muted-2',
};
const statusLabels: Record<Order['status'], string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<PaginatedResponse>('/orders', { params: { page, limit } });
      setOrders(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setNotification({ message: 'Không thể tải danh sách đơn hàng', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      setNotification({ message: 'Cập nhật trạng thái thành công', type: 'success' });
    } catch (error) {
      console.error('Failed to update order status:', error);
      setNotification({ message: 'Cập nhật trạng thái thất bại', type: 'error' });
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, limit]);

  const handlePrev = () => { if (page > 1) setPage(page - 1); };
  const handleNext = () => { if (page * limit < total) setPage(page + 1); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Quản lý Đơn hàng</h1>
        <p className="mt-1 text-sm text-muted">{total} đơn hàng</p>
      </div>

      {notification && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${
            notification.type === 'success'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-danger/30 bg-danger-soft text-danger'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted">Đang tải...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-2">
                  <th className="px-5 py-3 font-medium">Mã đơn</th>
                  <th className="px-5 py-3 font-medium">Khách hàng</th>
                  <th className="px-5 py-3 font-medium">Tổng tiền</th>
                  <th className="px-5 py-3 font-medium">Trạng thái</th>
                  <th className="px-5 py-3 font-medium">SL</th>
                  <th className="px-5 py-3 font-medium">Ngày tạo</th>
                  <th className="px-5 py-3 text-right font-medium">Cập nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-surface-2">
                    <td className="px-5 py-3 font-mono text-xs text-muted-2">{order.id.slice(0, 8)}…</td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{order.user.email}</p>
                      {order.user.name && <p className="text-xs text-muted-2">{order.user.name}</p>}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-medium">{formatCurrency(order.total)}</td>
                    <td className="px-5 py-3">
                      <span className={`chip text-xs ${statusStyles[order.status]}`}>{statusLabels[order.status]}</span>
                    </td>
                    <td className="px-5 py-3 text-muted">{order.items.length}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-muted-2">{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                          className="input w-auto py-1.5 text-sm"
                        >
                          <option value="PENDING">Chờ thanh toán</option>
                          <option value="PAID">Đã thanh toán</option>
                          <option value="FAILED">Thất bại</option>
                          <option value="REFUNDED">Đã hoàn tiền</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-muted">Không có đơn hàng</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={handlePrev} disabled={page === 1} className="btn-outline disabled:cursor-not-allowed disabled:opacity-50">
          Trang trước
        </button>
        <span className="text-sm text-muted-2">
          Trang {page} / {Math.max(1, Math.ceil(total / limit))}
        </span>
        <button onClick={handleNext} disabled={page * limit >= total} className="btn-outline disabled:cursor-not-allowed disabled:opacity-50">
          Tiếp theo
        </button>
      </div>
    </div>
  );
};

export default Orders;
