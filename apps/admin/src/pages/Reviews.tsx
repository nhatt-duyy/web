import { useState, useEffect, useCallback } from 'react';
import apiClient from '../lib/api-client';

type ReviewUser = { id: string; name: string | null; email: string };
type ReviewProduct = { id: string; slug: string; title: string };
type Review = {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string | null;
  status: 'PENDING' | 'APPROVED';
  createdAt: string;
  user: ReviewUser;
  product: ReviewProduct;
};

const statusStyles: Record<Review['status'], string> = {
  PENDING: 'border-warning/30 bg-warning/10 text-warning',
  APPROVED: 'border-success/30 bg-success/10 text-success',
};
const statusLabels: Record<Review['status'], string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
};

const Stars = ({ value }: { value: number }) => (
  <span className="font-mono text-sm text-amber-500">{`${value}/5`}</span>
);

const Filters = [
  { value: '', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
] as const;

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      const data = await apiClient.get<Review[]>('/reviews/admin', { params });
      setReviews(data.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setNotification({ message: 'Không thể tải danh sách đánh giá', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleApprove = async (id: string) => {
    try {
      await apiClient.patch(`/reviews/admin/${id}/approve`, {});
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'APPROVED' } : r)));
      setNotification({ message: 'Đã duyệt đánh giá', type: 'success' });
    } catch (error) {
      console.error('Failed to approve review:', error);
      setNotification({ message: 'Duyệt đánh giá thất bại', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xoá đánh giá này?')) return;
    try {
      await apiClient.delete(`/reviews/admin/${id}`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setNotification({ message: 'Đã xoá đánh giá', type: 'success' });
    } catch (error) {
      console.error('Failed to delete review:', error);
      setNotification({ message: 'Xoá đánh giá thất bại', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Kiểm duyệt Đánh giá</h1>
        <p className="mt-1 text-sm text-muted">{reviews.length} đánh giá</p>
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

      <div className="flex flex-wrap gap-2">
        {Filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`chip transition-colors ${
              status === f.value ? 'border-primary bg-primary text-white' : 'border-border text-muted hover:border-border-strong'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted">Đang tải...</div>
        ) : (
          <div className="divide-y divide-border">
            {reviews.map((r) => (
              <div key={r.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} />
                    <span className={`chip text-xs ${statusStyles[r.status]}`}>{statusLabels[r.status]}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-foreground">
                    {r.product.title}
                  </p>
                  <p className="text-xs text-muted-2">
                    {r.user.name ?? r.user.email} · {new Date(r.createdAt).toLocaleString('vi-VN')}
                  </p>
                  {r.comment && <p className="mt-2 text-sm leading-relaxed text-muted">{r.comment}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  {r.status === 'PENDING' && (
                    <button
                      onClick={() => handleApprove(r.id)}
                      className="btn-primary px-3 py-1.5 text-sm"
                    >
                      Duyệt
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="btn-outline px-3 py-1.5 text-sm text-danger"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="p-10 text-center text-sm text-muted">Không có đánh giá</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
