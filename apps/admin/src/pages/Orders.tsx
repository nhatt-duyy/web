import React, { useState, useEffect } from 'react';
import apiClient from '../lib/api-client';

// Types based on the API contract
type Product = {
  id: string;
  title: string;
  thumbnail: string;
};

type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  price: number; // Assuming price is a number (VND)
  product: Product;
};

type User = {
  id: string;
  email: string;
  name: string;
};

type Order = {
  id: string;
  userId: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  total: number; // integer VND
  provider: string;
  providerRef: string;
  createdAt: string; // ISO string
  items: OrderItem[];
  user: User;
};

type PaginatedResponse = {
  data: Order[];
  total: number;
  page: number;
  limit: number;
};

// Status label and color mapping
const statusLabels: Record<Order['status'], { label: string; color: string }> = {
  PENDING: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800' },
  PAID: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Thất bại', color: 'bg-red-100 text-red-800' },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'bg-gray-100 text-gray-800' },
};

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
      const response = await apiClient.get<PaginatedResponse>('/orders', {
        params: { page, limit }
      });
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
      // Update optimistic UI
      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      setNotification({ message: 'Cập nhật trạng thái thành công', type: 'success' });
    } catch (error) {
      console.error('Failed to update order status:', error);
      setNotification({ message: 'Cập nhật trạng thái thất bại', type: 'error' });
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, limit]);

  const handlePrev = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNext = () => {
    if (page * limit < total) setPage(page + 1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Quản lý Đơn hàng</h1>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`flex items-center p-4 mb-4 rounded-lg ${
            notification.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-border">
          <thead>
            <tr className="bg-muted">
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                Mã đơn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                Khách hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                Tổng tiền
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                Số sản phẩm
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                Ngày tạo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-accent/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {order.id.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatCurrency(order.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`${statusLabels[order.status].color} px-2 py-1 rounded-full text-xs`}>
                    {statusLabels[order.status].label}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.items.length}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {new Date(order.createdAt).toLocaleString('vi-VN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm flex space-x-2">
                  <select
                    value={order.status}
                    onChange={e => handleStatusChange(order.id, e.target.value as Order['status'])}
                    className="border border-border rounded-md px-2 py-1 bg-background text-sm"
                  >
                    <option value="PENDING">Chờ thanh toán</option>
                    <option value="PAID">Đã thanh toán</option>
                    <option value="FAILED">Thất bại</option>
                    <option value="REFUNDED">Đã hoàn tiền</option>
                  </select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-muted-foreground">
                  Không có đơn hàng
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrev}
          disabled={page === 1}
          className={`px-4 py-2 rounded-md border border-border hover:bg-accent/50 disabled:opacity-50`}
        >
          Trang trước
        </button>
        <span className="text-sm text-muted-foreground">
          Trang {page} của {Math.ceil(total / limit)}
        </span>
        <button
          onClick={handleNext}
          disabled={page * limit >= total}
          className={`px-4 py-2 rounded-md border border-border hover:bg-accent/50`}
        >
          Tiếp theo
        </button>
      </div>
    </div>
  );
};

export default Orders;