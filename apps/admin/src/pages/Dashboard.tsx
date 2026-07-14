import { useEffect, useState } from 'react';
import apiClient from '../lib/api-client';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Assuming backend provides /stats endpoint
        const response = await apiClient.get('/stats');
        setStats(response.data);
      } catch (err: any) {
        setError('Không thể tải thống kê');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-destructive text-center">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Tổng quan Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-popover p-6 rounded-lg shadow border border-border">
          <h3 className="text-sm font-muted text-muted-foreground">Tổng sản phẩm</h3>
          <p className="mt-2 text-3xl font-bold text-foreground">{stats.totalProducts}</p>
        </div>
        <div className="bg-popover p-6 rounded-lg shadow border border-border">
          <h3 className="text-sm font-muted text-muted-foreground">Tổng đơn hàng</h3>
          <p className="mt-2 text-3xl font-bold text-foreground">{stats.totalOrders}</p>
        </div>
        <div className="bg-popover p-6 rounded-lg shadow border border-border">
          <h3 className="text-sm font-muted text-muted-foreground">Tổng người dùng</h3>
          <p className="mt-2 text-3xl font-bold text-foreground">{stats.totalUsers}</p>
        </div>
        <div className="bg-popover p-6 rounded-lg shadow border border-border">
          <h3 className="text-sm font-muted text-muted-foreground">Doanh thu (VNĐ)</h3>
          <p className="mt-2 text-3xl font-bold text-foreground">{stats.totalRevenue?.toLocaleString() ?? '0'}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
