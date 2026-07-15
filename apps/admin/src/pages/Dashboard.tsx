import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../lib/api-client';

type Stats = { totalProducts: number; totalOrders: number; totalUsers: number; totalRevenue: number };
type Product = { id: string; title: string; price: number; thumbnail: string | null; isPublished: boolean };
type Order = { id: string; user: { email: string }; total: number; status: string; createdAt: string };

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const BoxIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="m12 13 0 8" />
  </svg>
);
const ReceiptIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3l-2 1.5L15 3l-2 1.5L11 3 9 4.5 7 3 5 4.5Z" /><path d="M9 8h6M9 12h6" />
  </svg>
);
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
  </svg>
);
const RevenueIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const KPI = ({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: string }) => (
  <div className="card card-hover relative overflow-hidden p-5">
    <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full ${tint} opacity-30 blur-2xl`} />
    <div className="relative flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-sm text-muted">{label}</p>
        <p className="mt-0.5 font-display text-2xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, p, o] = await Promise.all([
          apiClient.get<Stats>('/stats'),
          apiClient.get<{ data: Product[] }>('/products', { params: { limit: 5 } }),
          apiClient.get<{ data: Order[] }>('/orders', { params: { limit: 5 } }),
        ]);
        setStats(s.data);
        setProducts(p.data.data);
        setOrders(o.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="grid h-64 place-items-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Tổng quan</h1>
        <p className="mt-1 text-sm text-muted">Bức tranh toàn cảnh về sản phẩm, đơn hàng và doanh thu.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI icon={<BoxIcon />} label="Tổng sản phẩm" value={`${stats?.totalProducts ?? 0}`} tint="bg-primary" />
        <KPI icon={<ReceiptIcon />} label="Tổng đơn hàng" value={`${stats?.totalOrders ?? 0}`} tint="bg-accent" />
        <KPI icon={<UsersIcon />} label="Người dùng" value={`${stats?.totalUsers ?? 0}`} tint="bg-primary" />
        <KPI icon={<RevenueIcon />} label="Doanh thu" value={fmt(stats?.totalRevenue ?? 0)} tint="bg-accent" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Sản phẩm mới nhất</h2>
            <Link to="/products" className="text-sm font-medium text-primary hover:underline">Xem tất cả</Link>
          </div>
          <ul className="space-y-1">
            {products.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2">
                {p.thumbnail ? (
                  <img src={p.thumbnail} alt="" className="h-10 w-10 rounded-lg border border-border object-cover" />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 text-xs text-muted-2">—</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-muted-2">{fmt(p.price)}</p>
                </div>
                <span className={`chip text-xs ${p.isPublished ? 'text-success' : 'text-muted-2'}`}>
                  {p.isPublished ? 'Xuất bản' : 'Nháp'}
                </span>
              </li>
            ))}
            {products.length === 0 && <li className="px-2 py-6 text-center text-sm text-muted">Chưa có sản phẩm</li>}
          </ul>
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Đơn hàng gần đây</h2>
            <Link to="/orders" className="text-sm font-medium text-primary hover:underline">Xem tất cả</Link>
          </div>
          <ul className="space-y-1">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 font-mono text-[11px] text-muted-2">
                  {o.id.slice(0, 4)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{o.user.email}</p>
                  <p className="text-xs text-muted-2">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <span className="text-sm font-semibold">{fmt(o.total)}</span>
              </li>
            ))}
            {orders.length === 0 && <li className="px-2 py-6 text-center text-sm text-muted">Chưa có đơn hàng</li>}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
