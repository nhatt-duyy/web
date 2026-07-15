import { useEffect, useState } from 'react';
import apiClient from '../lib/api-client';
import { useAuth } from '../auth/AuthContext';
import { AreaClosed, Pie, Arc, LinePath } from '@visx/shape';
import { scaleLinear, scaleTime } from '@visx/scale';
import { LinearGradient } from '@visx/gradient';
import { ParentSize } from '@visx/responsive';

/* ============================ Types (Mục 2) ============================ */
type StatusSlice = { status: string; count: number };
type TopProduct = { id: string; title: string; qty: number; revenue: number };
type RecentOrder = { id: string; user: { email: string }; total: number; status: string; createdAt: string };
type Overview = {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue?: number;
  newUsers: number;
  orderStatusBreakdown: StatusSlice[];
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
};
type RevenuePoint = { date: string; revenue: number };

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const parseDate = (s: string) => new Date(s + 'T00:00:00');

/* ============================ Icons ============================ */
const BoxIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="m12 13 0 8" />
  </svg>
);
const ReceiptIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3l-2 1.5L15 3l-2 1.5L11 3 9 4.5 7 3 5 4.5Z" />
    <path d="M9 8h6M9 12h6" />
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

/* ============================ Reusable blocks ============================ */
const KpiCard = ({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: string }) => (
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

const ChartCard = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <section className="card p-5">
    <div className="mb-4">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-muted-2">{hint}</p>}
    </div>
    {children}
  </section>
);

const STATUS_COLOR: Record<string, string> = {
  PAID: 'var(--success)',
  PENDING: 'var(--warning)',
  FAILED: 'var(--danger)',
  REFUNDED: 'var(--muted)',
};
const STATUS_LABEL: Record<string, string> = {
  PAID: 'Đã thanh toán',
  PENDING: 'Chờ thanh toán',
  FAILED: 'Thất bại',
  REFUNDED: 'Hoàn tiền',
};

/* ============================ Charts (visx / d3) ============================ */
const RevenueArea = ({ series }: { series: RevenuePoint[] }) => {
  if (series.length === 0) return <p className="py-10 text-center text-sm text-muted">Chưa có dữ liệu doanh thu</p>;
  return (
    <div className="h-56 w-full">
      <ParentSize>
        {({ width, height }) => {
          const margin = { top: 10, right: 12, bottom: 24, left: 52 };
          const innerW = Math.max(0, width - margin.left - margin.right);
          const innerH = Math.max(0, height - margin.top - margin.bottom);
          const xScale = scaleTime({
            domain: [parseDate(series[0].date), parseDate(series[series.length - 1].date)],
            range: [0, innerW],
          });
          const maxRev = Math.max(1, ...series.map((s) => s.revenue));
          const yScale = scaleLinear({ domain: [0, maxRev], range: [innerH, 0], nice: true });
          const ticks = yScale.ticks(4);
          return (
            <svg width={width} height={height} className="overflow-visible">
              <LinearGradient id="revFill" from="var(--accent)" to="var(--accent)" fromOpacity={0.35} toOpacity={0.02} />
              <g transform={`translate(${margin.left},${margin.top})`}>
                {ticks.map((t) => (
                  <g key={t} transform={`translate(0,${yScale(t)})`}>
                    <line x1={0} x2={innerW} stroke="var(--border)" strokeDasharray="3 3" />
                    <text x={-10} dy="0.32em" textAnchor="end" className="fill-muted-2" style={{ fontSize: 10 }}>{fmt(t)}</text>
                  </g>
                ))}
                <AreaClosed
                  data={series}
                  x={(d) => xScale(parseDate(d.date)) ?? 0}
                  y={(d) => yScale(d.revenue)}
                  yScale={yScale}
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="url(#revFill)"
                />
                <LinePath
                  data={series}
                  x={(d) => xScale(parseDate(d.date)) ?? 0}
                  y={(d) => yScale(d.revenue)}
                  stroke="var(--accent)"
                  strokeWidth={2}
                />
                <text x={innerW} y={innerH + 18} textAnchor="end" className="fill-muted-2" style={{ fontSize: 10 }}>
                  {series[0].date.slice(5)} → {series[series.length - 1].date.slice(5)}
                </text>
              </g>
            </svg>
          );
        }}
      </ParentSize>
    </div>
  );
};

const StatusDonut = ({ slices }: { slices: StatusSlice[] }) => {
  const total = slices.reduce((s, x) => s + x.count, 0);
  if (total === 0) return <p className="py-10 text-center text-sm text-muted">Chưa có đơn hàng</p>;
  const size = 180;
  const r = size / 2;
  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} className="overflow-visible">
        <Pie data={slices} pieValue={(d) => d.count} outerRadius={r - 4} innerRadius={(r - 4) * 0.62} cornerRadius={3} padAngle={0.03}>
          {(pie) => (
            <g transform={`translate(${r},${r})`}>
              {pie.arcs.map((arc, i) => (
                <Arc key={i} data={arc} fill={STATUS_COLOR[arc.data.status] ?? 'var(--muted)'} />
              ))}
            </g>
          )}
        </Pie>
        <text x={r} y={r - 4} textAnchor="middle" className="fill-foreground" style={{ fontSize: 18, fontWeight: 700 }}>{total}</text>
        <text x={r} y={r + 14} textAnchor="middle" className="fill-muted-2" style={{ fontSize: 10 }}>đơn</text>
      </svg>
      <ul className="w-full space-y-1.5">
        {slices.map((s) => (
          <li key={s.status} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR[s.status] ?? 'var(--muted)' }} />
              {STATUS_LABEL[s.status] ?? s.status}
            </span>
            <span className="tabular-nums text-muted">{s.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const TopProductsBar = ({ items }: { items: TopProduct[] }) => {
  if (items.length === 0) return <p className="py-10 text-center text-sm text-muted">Chưa có sản phẩm bán</p>;
  const maxQty = Math.max(1, ...items.map((p) => p.qty));
  return (
    <ul className="space-y-3">
      {items.map((p) => (
        <li key={p.id}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate font-medium">{p.title}</span>
            <span className="ml-2 shrink-0 tabular-nums text-muted">{p.qty} lượt</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
};

/* ============================ Page ============================ */
const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [overview, setOverview] = useState<Overview | null>(null);
  const [revenue, setRevenue] = useState<RevenuePoint[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Overview luôn gọi; revenue chỉ ADMIN mới gọi (2.4).
        const ov = await apiClient.get<Overview>('/stats/overview');
        setOverview(ov.data);
        if (isAdmin) {
          const rev = await apiClient.get<{ series: RevenuePoint[] }>('/stats/revenue');
          setRevenue(rev.data.series);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin]);

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
        <KpiCard icon={<BoxIcon />} label="Tổng sản phẩm" value={`${overview?.totalProducts ?? 0}`} tint="bg-primary" />
        <KpiCard icon={<ReceiptIcon />} label="Tổng đơn hàng" value={`${overview?.totalOrders ?? 0}`} tint="bg-accent" />
        <KpiCard icon={<UsersIcon />} label="Người dùng" value={`${overview?.totalUsers ?? 0}`} tint="bg-primary" />
        <KpiCard icon={<RevenueIcon />} label="Doanh thu" value={fmt(overview?.totalRevenue ?? 0)} tint="bg-accent" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Doanh thu 30 ngày" hint="Chỉ tính đơn đã thanh toán (PAID)">
            {revenue ? <RevenueArea series={revenue} /> : <p className="py-10 text-center text-sm text-muted">Không có quyền xem doanh thu</p>}
          </ChartCard>
        </div>
        <ChartCard title="Trạng thái đơn">
          <StatusDonut slices={overview?.orderStatusBreakdown ?? []} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Top sản phẩm bán chạy" hint="5 sản phẩm bán nhiều nhất">
            <TopProductsBar items={overview?.topProducts ?? []} />
          </ChartCard>
        </div>
        <ChartCard title="Đơn hàng gần đây" hint="5 đơn mới nhất">
          <ul className="space-y-1">
            {(overview?.recentOrders ?? []).map((o) => (
              <li key={o.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 font-mono text-[11px] text-muted-2">{o.id.slice(0, 4)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{o.user.email}</p>
                  <p className="text-xs text-muted-2">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <span className="text-sm font-semibold">{fmt(o.total)}</span>
              </li>
            ))}
            {(overview?.recentOrders ?? []).length === 0 && <li className="px-2 py-6 text-center text-sm text-muted">Chưa có đơn hàng</li>}
          </ul>
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;
