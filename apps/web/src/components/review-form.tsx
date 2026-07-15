'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useApi } from '@/lib/api-client';
import { StarIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/primitives';

export default function ReviewForm({ productId }: { productId: string }) {
  const { data: session, status } = useSession();
  const api = useApi();

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'unauthenticated') {
    return (
      <div className="rounded-xl border border-border bg-surface/60 p-4 text-sm text-muted">
        Bạn cần{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          đăng nhập
        </Link>{' '}
        để viết đánh giá.
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm font-medium text-success">
        Cảm ơn bạn! Đánh giá đang chờ admin duyệt trước khi hiển thị.
      </div>
    );
  }

  const submit = async () => {
    if (rating < 1) {
      setError('Vui lòng chọn số sao.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api(`/reviews`, {
        method: 'POST',
        body: JSON.stringify({ productId, rating, comment: comment.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Gửi đánh giá thất bại');
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4">
      <h3 className="text-sm font-semibold text-foreground">Viết đánh giá của bạn</h3>

      <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label="Chọn số sao">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={rating === v}
            aria-label={`${v} sao`}
            onClick={() => setRating(v)}
            onMouseEnter={() => setHover(v)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <StarIcon
              className={`h-6 w-6 ${v <= (hover || rating) ? 'text-amber-400' : 'text-border'}`}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Chia sẻ trải nghiệm của bạn (tuỳ chọn)..."
        className="mt-3 w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
      />

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <div className="mt-3 flex justify-end">
        <Button onClick={submit} disabled={submitting}>
          {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
        </Button>
      </div>
    </div>
  );
}
