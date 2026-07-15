import { useState, useEffect, useCallback } from 'react';
import apiClient from '../lib/api-client';
import { CouponType } from '../lib/types';

type Coupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrder: number | null;
  maxDiscount: number | null;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
};

const typeLabel: Record<CouponType, string> = {
  PERCENT: '%',
  FIXED: 'VND',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const Coupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [type, setType] = useState<CouponType>(CouponType.PERCENT);
  const [value, setValue] = useState<number>(10);
  const [minOrder, setMinOrder] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<Coupon[]>('/coupons');
      setCoupons(data.data);
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
      setNotification({ message: 'Không thể tải danh sách mã', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const resetForm = () => {
    setCode('');
    setType(CouponType.PERCENT);
    setValue(10);
    setMinOrder('');
    setMaxDiscount('');
    setExpiresAt('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);
    try {
      await apiClient.post('/coupons', {
        code,
        type,
        value: Number(value),
        minOrder: minOrder ? Number(minOrder) : undefined,
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        active: true,
      });
      setNotification({ message: 'Tạo mã giảm giá thành công', type: 'success' });
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      setNotification({ message: error.response?.data?.message || 'Tạo mã thất bại', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Coupon) => {
    try {
      await apiClient.patch(`/coupons/${c.id}`, { active: !c.active });
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: !c.active } : x)));
    } catch (error) {
      console.error('Failed to toggle coupon:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xoá mã này?')) return;
    try {
      await apiClient.delete(`/coupons/${id}`);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      setNotification({ message: 'Đã xoá mã', type: 'success' });
    } catch (error) {
      console.error('Failed to delete coupon:', error);
      setNotification({ message: 'Xoá mã thất bại', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Mã giảm giá</h1>
        <p className="mt-1 text-sm text-muted">{coupons.length} mã</p>
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

      <form onSubmit={handleCreate} className="card space-y-4 p-6">
        <h3 className="font-display text-lg font-bold">Thêm mã mới</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Mã (viết hoa)</label>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="input"
              placeholder="SUMMER10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Loại</label>
            <select value={type} onChange={(e) => setType(e.target.value as CouponType)} className="input">
              <option value={CouponType.PERCENT}>Phần trăm (%)</option>
              <option value={CouponType.FIXED}>Số tiền (VND)</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Giá trị {type === CouponType.PERCENT ? '(1-100%)' : '(VND)'}
            </label>
            <input
              type="number"
              required
              min={1}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="input"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Đơn tối thiểu (VND)</label>
            <input
              type="number"
              min={0}
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              className="input"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Trần giảm (VND)</label>
            <input
              type="number"
              min={0}
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              className="input"
              placeholder="không giới hạn"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Hết hạn</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="input"
            />
          </div>
        </div>
        <div>
          <button type="submit" disabled={saving || !code} className="btn-primary disabled:opacity-50">
            {saving ? 'Đang lưu...' : 'Tạo mã'}
          </button>
        </div>
      </form>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted">Đang tải...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-2">
                  <th className="px-5 py-3 font-medium">Mã</th>
                  <th className="px-5 py-3 font-medium">Giảm</th>
                  <th className="px-5 py-3 font-medium">Đơn tối thiểu</th>
                  <th className="px-5 py-3 font-medium">Hết hạn</th>
                  <th className="px-5 py-3 font-medium">Trạng thái</th>
                  <th className="px-5 py-3 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-surface-2">
                    <td className="px-5 py-3 font-mono font-medium">{c.code}</td>
                    <td className="px-5 py-3">
                      {c.type === CouponType.PERCENT ? `${c.value}%` : formatCurrency(c.value)}
                    </td>
                    <td className="px-5 py-3 text-muted">{c.minOrder ? formatCurrency(c.minOrder) : '—'}</td>
                    <td className="px-5 py-3 text-muted-2">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleActive(c)}
                        className={`chip text-xs ${
                          c.active ? 'border-success/30 bg-success/10 text-success' : 'text-muted-2'
                        }`}
                      >
                        {c.active ? 'Đang bật' : 'Đã tắt'}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="font-medium text-danger transition-colors hover:text-danger-soft"
                        >
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted">Chưa có mã giảm giá</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Coupons;
