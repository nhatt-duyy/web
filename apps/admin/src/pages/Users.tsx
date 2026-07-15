import { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../lib/api-client';
import { Role } from '../lib/rbac';

// Debounce tìm kiếm 300ms — tránh gọi API mỗi ký tự (Mục 3.2).
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  isActive: boolean;
  image: string | null;
  createdAt: string;
  _count: { orders: number; licenses: number; reviews: number; tickets: number };
};

type UserDetail = UserRow & {
  emailVerifiedAt: string | null;
  orders: { id: string; total: number; status: string; createdAt: string }[];
  licenses: { id: string; key: string; downloadCount: number; downloadLimit: number; product: { title: string } }[];
  tickets: { id: string; subject: string; status: string; priority: string; createdAt: string }[];
  reviews: { id: string; rating: number; comment: string | null; status: string; product: { title: string } }[];
};

const ROLE_BADGE: Record<Role, string> = {
  ADMIN: 'bg-danger-soft text-danger',
  STAFF: 'bg-warning/10 text-warning',
  CUSTOMER: 'bg-surface-2 text-muted',
};

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Quản trị',
  STAFF: 'Nhân viên',
  CUSTOMER: 'Khách',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatDate = (s: string) => new Date(s).toLocaleDateString('vi-VN');

const Users = () => {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'ALL' | Role>('ALL');
  const [active, setActive] = useState<'ALL' | 'true' | 'false'>('ALL');
  const debouncedSearch = useDebounce(search, 300);

  const [selected, setSelected] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab] = useState<'orders' | 'licenses' | 'tickets' | 'reviews'>('orders');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('email', debouncedSearch);
      if (role !== 'ALL') params.set('role', role);
      if (active !== 'ALL') params.set('isActive', active);
      params.set('limit', '20');
      const { data } = await apiClient.get<{ data: UserRow[]; total: number }>(`/users?${params.toString()}`);
      setRows(data.data);
      setTotal(data.total);
    } catch (e: any) {
      setNotice({ type: 'error', message: e?.response?.data?.message || 'Không thể tải danh sách user' });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, role, active]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setSelected(null);
    setTab('orders');
    setNotice(null);
    try {
      const { data } = await apiClient.get<UserDetail>(`/users/${id}`);
      setSelected(data);
    } catch (e: any) {
      setNotice({ type: 'error', message: e?.response?.data?.message || 'Không thể tải chi tiết' });
    } finally {
      setDetailLoading(false);
    }
  };

  const changeRole = async (rid: string, newRole: Role) => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.patch(`/users/${rid}/role`, { role: newRole });
      setSelected({ ...selected, role: newRole });
      setRows((prev) => prev.map((u) => (u.id === rid ? { ...u, role: newRole } : u)));
      setNotice({ type: 'success', message: `Đã đổi vai trò thành ${ROLE_LABEL[newRole]}` });
    } catch (e: any) {
      setNotice({ type: 'error', message: e?.response?.data?.message || 'Đổi vai trò thất bại' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (rid: string) => {
    if (!selected) return;
    const next = !selected.isActive;
    setSaving(true);
    try {
      await apiClient.patch(`/users/${rid}/active`, { isActive: next });
      setSelected({ ...selected, isActive: next });
      setRows((prev) => prev.map((u) => (u.id === rid ? { ...u, isActive: next } : u)));
      setNotice({ type: 'success', message: next ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản' });
    } catch (e: any) {
      setNotice({ type: 'error', message: e?.response?.data?.message || 'Thao tác thất bại' });
    } finally {
      setSaving(false);
    }
  };

  const initials = (u: { name?: string | null; email: string }) =>
    (u.name ?? u.email ?? '?').slice(0, 1).toUpperCase();

  const tabCount: Record<string, number> = useMemo(() => {
    if (!selected) return { orders: 0, licenses: 0, tickets: 0, reviews: 0 };
    return {
      orders: selected.orders.length,
      licenses: selected.licenses.length,
      tickets: selected.tickets.length,
      reviews: selected.reviews.length,
    };
  }, [selected]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Khách hàng</h1>
          <p className="mt-1 text-sm text-muted">{total} user</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-56"
            placeholder="Tìm email / tên..."
            aria-label="Tìm kiếm user"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'ALL' | Role)}
            className="input w-36"
            aria-label="Lọc vai trò"
          >
            <option value="ALL">Mọi vai trò</option>
            <option value="ADMIN">Quản trị</option>
            <option value="STAFF">Nhân viên</option>
            <option value="CUSTOMER">Khách</option>
          </select>
          <select
            value={active}
            onChange={(e) => setActive(e.target.value as 'ALL' | 'true' | 'false')}
            className="input w-36"
            aria-label="Lọc trạng thái"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Bị khóa</option>
          </select>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${
            notice.type === 'success' ? 'border-success/30 bg-success/10 text-success' : 'border-danger/30 bg-danger-soft text-danger'
          }`}
        >
          {notice.message}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-2">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Vai trò</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-right">Đơn</th>
                <th className="px-4 py-3 font-medium text-right">License</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">Đang tải...</td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">Không có user nào</td>
                </tr>
              )}
              {!loading &&
                rows.map((u) => (
                  <tr key={u.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                          {initials(u)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{u.name ?? '—'}</p>
                          <p className="truncate text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_BADGE[u.role]}`}>
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="text-success">● Hoạt động</span>
                      ) : (
                        <span className="text-danger">● Bị khóa</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{u._count.orders}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{u._count.licenses}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="btn-outline px-3 py-1 text-sm" onClick={() => openDetail(u.id)}>
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal chi tiết */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div
            className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Chi tiết user"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-lg font-bold text-primary">
                  {initials(selected)}
                </span>
                <div>
                  <p className="font-display text-lg font-bold">{selected.name ?? '—'}</p>
                  <p className="text-sm text-muted">{selected.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[selected.role]}`}>
                      {ROLE_LABEL[selected.role]}
                    </span>
                    {selected.isActive ? (
                      <span className="text-xs text-success">● Hoạt động</span>
                    ) : (
                      <span className="text-xs text-danger">● Bị khóa</span>
                    )}
                  </div>
                </div>
              </div>
              <button className="chip" onClick={() => setSelected(null)} aria-label="Đóng">✕</button>
            </div>

            {/* Hành động */}
            <div className="flex flex-wrap items-center gap-3 border-b border-border p-5">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Đổi vai trò:</label>
                <select
                  className="input w-40"
                  value={selected.role}
                  disabled={saving}
                  onChange={(e) => changeRole(selected.id, e.target.value as Role)}
                  aria-label="Đổi vai trò"
                >
                  <option value="CUSTOMER">Khách</option>
                  <option value="STAFF">Nhân viên</option>
                  <option value="ADMIN">Quản trị</option>
                </select>
              </div>
              <button
                className={selected.isActive ? 'btn-outline px-3 py-1.5 text-sm text-danger' : 'btn-outline px-3 py-1.5 text-sm text-success'}
                disabled={saving}
                onClick={() => toggleActive(selected.id)}
              >
                {selected.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border px-5 pt-3">
              {(['orders', 'licenses', 'tickets', 'reviews'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-t-lg px-3 py-2 text-sm font-medium ${
                    tab === t ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-foreground'
                  }`}
                >
                  {t === 'orders' ? 'Đơn hàng' : t === 'licenses' ? 'License' : t === 'tickets' ? 'Ticket' : 'Review'}
                  <span className="ml-1.5 rounded-full bg-surface-2 px-1.5 text-xs">{tabCount[t]}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3 p-5">
              {detailLoading && <p className="text-sm text-muted">Đang tải...</p>}
              {!detailLoading && tab === 'orders' && selected.orders.length === 0 && <Empty text="Chưa có đơn hàng" />}
              {!detailLoading && tab === 'orders' && selected.orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                  <span className="font-mono text-xs text-muted">{o.id.slice(0, 8)}</span>
                  <span className="font-semibold">{formatCurrency(o.total)}</span>
                  <span className="text-muted">{o.status}</span>
                  <span className="text-muted">{formatDate(o.createdAt)}</span>
                </div>
              ))}
              {!detailLoading && tab === 'licenses' && selected.licenses.length === 0 && <Empty text="Chưa có license" />}
              {!detailLoading && tab === 'licenses' && selected.licenses.map((l) => (
                <div key={l.id} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{l.product.title}</p>
                  <p className="mt-1 font-mono text-xs text-muted">{l.key}</p>
                  <p className="mt-1 text-xs text-muted">Tải {l.downloadCount}/{l.downloadLimit}</p>
                </div>
              ))}
              {!detailLoading && tab === 'tickets' && selected.tickets.length === 0 && <Empty text="Chưa có ticket" />}
              {!detailLoading && tab === 'tickets' && selected.tickets.map((t) => (
                <div key={t.id} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{t.subject}</p>
                  <p className="mt-1 text-xs text-muted">{t.status} · {t.priority} · {formatDate(t.createdAt)}</p>
                </div>
              ))}
              {!detailLoading && tab === 'reviews' && selected.reviews.length === 0 && <Empty text="Chưa có review" />}
              {!detailLoading && tab === 'reviews' && selected.reviews.map((r) => (
                <div key={r.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{r.product.title}</p>
                    <span className="text-warning">{'★'.repeat(r.rating)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{r.comment ?? '(không có nội dung)'}</p>
                  <p className="mt-1 text-xs text-muted-2">{r.status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Empty = ({ text }: { text: string }) => (
  <p className="py-6 text-center text-sm text-muted">{text}</p>
);

export default Users;
