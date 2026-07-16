'use client';
import { useState } from 'react';
import { useApi } from '@/lib/api-client';
import { MilestoneStatus, MILESTONE_STATUS_LABELS, formatVnd } from '@/lib/custom-projects';

interface Milestone {
  id: string;
  name: string;
  amount: number;
  percent: number | null;
  status: MilestoneStatus;
  paidAt: string | null;
}

const STATUS_STYLES: Record<MilestoneStatus, string> = {
  PENDING: 'bg-slate-500/10 text-slate-500 border-slate-500/30',
  INVOICED: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  PAID: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  SKIPPED: 'bg-red-500/10 text-red-500 border-red-500/30',
};

export function ProjectMilestones({ api, projectId, milestones }: {
  api: ReturnType<typeof useApi>;
  projectId: string;
  milestones: Milestone[];
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pay = async (mid: string) => {
    setBusyId(mid);
    setError(null);
    try {
      const res = await api(`/custom-projects/${projectId}/milestones/${mid}/pay-link`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Tạo link thanh toán thất bại');
      // Redirect sang PayOS
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
      else if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Tạo link thanh toán thất bại');
    } finally {
      setBusyId(null);
    }
  };

  if (milestones.length === 0) {
    return <p className="text-sm text-muted">Dự án chưa có mốc thanh toán. Admin sẽ cấu hình sau khi chốt báo giá.</p>;
  }

  return (
    <div className="space-y-3">
      {error && <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div>}
      {milestones.map((m) => {
        const canPay = m.status === 'PENDING' || m.status === 'INVOICED';
        return (
          <div
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"
          >
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="mt-0.5 text-sm text-muted">
                {formatVnd(m.amount)}
                {m.percent != null ? ` · ${m.percent}%` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[m.status]}`}>
                {MILESTONE_STATUS_LABELS[m.status]}
              </span>
              {canPay && (
                <button
                  onClick={() => pay(m.id)}
                  disabled={busyId === m.id}
                  className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:bg-primary-strong disabled:opacity-60"
                >
                  {busyId === m.id ? 'Đang xử lý…' : 'Thanh toán'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
