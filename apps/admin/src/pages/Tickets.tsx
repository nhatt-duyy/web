import { useState, useEffect, useCallback } from 'react';
import apiClient from '../lib/api-client';
import { TicketStatus } from '../lib/types';

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: TicketStatus;
  reply: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
};

const statusLabel: Record<TicketStatus, string> = {
  OPEN: 'Mới',
  REPLIED: 'Đã phản hồi',
  CLOSED: 'Đã đóng',
};

const TABS: { value: TicketStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: TicketStatus.OPEN, label: 'Mới' },
  { value: TicketStatus.REPLIED, label: 'Đã phản hồi' },
  { value: TicketStatus.CLOSED, label: 'Đã đóng' },
];

const Tickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'ALL' ? { status: filter } : undefined;
      const { data } = await apiClient.get<Ticket[]>('/tickets/admin', { params });
      setTickets(data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      setNotification({ message: 'Không thể tải danh sách ticket', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleReply = async (id: string) => {
    const reply = (replyText[id] ?? '').trim();
    if (!reply) return;
    setBusyId(id);
    try {
      await apiClient.patch(`/tickets/admin/${id}/reply`, { reply });
      setReplyText((prev) => ({ ...prev, [id]: '' }));
      setNotification({ message: 'Đã phản hồi ticket', type: 'success' });
      fetchTickets();
    } catch (error: any) {
      setNotification({ message: error.response?.data?.message || 'Phản hồi thất bại', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const handleClose = async (id: string) => {
    try {
      await apiClient.patch(`/tickets/admin/${id}/close`);
      setNotification({ message: 'Đã đóng ticket', type: 'success' });
      fetchTickets();
    } catch (error: any) {
      setNotification({ message: error.response?.data?.message || 'Đóng thất bại', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Hỗ trợ khách hàng</h1>
        <p className="mt-1 text-sm text-muted">{tickets.length} ticket</p>
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
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`chip text-xs ${
              filter === t.value ? 'border-primary/30 bg-primary-soft text-primary' : 'text-muted-2'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted">Đang tải...</div>
        ) : tickets.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted">Không có ticket nào</div>
        ) : (
          <div className="divide-y divide-border">
            {tickets.map((t) => (
              <div key={t.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-base font-semibold">{t.subject}</p>
                    <p className="mt-0.5 text-xs text-muted-2">
                      {t.user.name || t.user.email} ·{' '}
                      {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <span className="chip text-xs">{statusLabel[t.status]}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{t.message}</p>
                {t.reply && (
                  <div className="mt-3 rounded-xl border border-border bg-surface-2 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-2">
                      Phản hồi
                    </p>
                    <p className="whitespace-pre-wrap text-sm">{t.reply}</p>
                  </div>
                )}
                {t.status !== TicketStatus.CLOSED && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      rows={2}
                      value={replyText[t.id] ?? ''}
                      onChange={(e) =>
                        setReplyText((prev) => ({ ...prev, [t.id]: e.target.value }))
                      }
                      placeholder="Nhập phản hồi..."
                      className="input resize-y"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReply(t.id)}
                        disabled={busyId === t.id || !(replyText[t.id] ?? '').trim()}
                        className="btn-primary disabled:opacity-50"
                      >
                        {busyId === t.id ? 'Đang gửi...' : 'Gửi phản hồi'}
                      </button>
                      <button onClick={() => handleClose(t.id)} className="btn-outline">
                        Đóng ticket
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tickets;
