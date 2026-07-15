import { useState, useEffect, useCallback } from 'react';
import apiClient from '../lib/api-client';
import { TicketStatus } from '../lib/types';

type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';

type StaffUser = { id: string; name: string; email: string };

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  reply: string | null;
  assignedToId: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  assignedTo: { id: string; name: string; email: string } | null;
};

const statusLabel: Record<TicketStatus, string> = {
  OPEN: 'Mới',
  REPLIED: 'Đã phản hồi',
  CLOSED: 'Đã đóng',
};

const STATUS_BADGE: Record<TicketStatus, string> = {
  OPEN: 'bg-primary-soft text-primary',
  REPLIED: 'bg-warning/10 text-warning',
  CLOSED: 'bg-surface-2 text-muted',
};

const priorityLabel: Record<TicketPriority, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
};

const PRIORITY_BADGE: Record<TicketPriority, string> = {
  LOW: 'bg-surface-2 text-muted',
  MEDIUM: 'bg-primary-soft text-primary',
  HIGH: 'bg-danger-soft text-danger',
};

const STATUS_TABS: { value: TicketStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: TicketStatus.OPEN, label: 'Mới' },
  { value: TicketStatus.REPLIED, label: 'Đã phản hồi' },
  { value: TicketStatus.CLOSED, label: 'Đã đóng' },
];

const PRIORITY_TABS: { value: TicketPriority | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Mọi ưu tiên' },
  { value: 'HIGH', label: 'Cao' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'LOW', label: 'Thấp' },
];

const Tickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'ALL'>('ALL');
  const [assignFilter, setAssignFilter] = useState<'ALL' | 'unassigned' | 'mine'>('ALL');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const myId = (() => {
    try {
      return JSON.parse(localStorage.getItem('admin_user') || '{}')?.id;
    } catch {
      return undefined;
    }
  })();

  const fetchStaff = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([
        apiClient.get<StaffUser[]>('/users', { params: { role: 'STAFF', limit: 50 } }),
        apiClient.get<StaffUser[]>('/users', { params: { role: 'ADMIN', limit: 50 } }),
      ]);
      const merged = [...s.data, ...a.data].filter(
        (u, i, arr) => arr.findIndex((x) => x.id === u.id) === i,
      );
      setStaff(merged);
    } catch {
      /* bỏ qua nếu không lấy được */
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (assignFilter === 'unassigned') params.assignedTo = 'unassigned';
      else if (assignFilter === 'mine' && myId) params.assignedTo = myId;
      const { data } = await apiClient.get<Ticket[]>('/tickets/admin', { params });
      setTickets(data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      setNotification({ message: 'Không thể tải danh sách ticket', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, assignFilter, myId]);

  useEffect(() => {
    fetchTickets();
    fetchStaff();
  }, [fetchTickets, fetchStaff]);

  const patch = async (id: string, payload: Record<string, unknown>, msg: string) => {
    setBusyId(id);
    try {
      await apiClient.patch(`/tickets/admin/${id}`, payload);
      setNotification({ message: msg, type: 'success' });
      fetchTickets();
    } catch (error: any) {
      setNotification({ message: error.response?.data?.message || 'Thao tác thất bại', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const handleReply = (id: string) => {
    const reply = (replyText[id] ?? '').trim();
    if (!reply) return;
    patch(id, { reply }, 'Đã phản hồi ticket');
    setReplyText((prev) => ({ ...prev, [id]: '' }));
  };

  const handleClose = (id: string) => patch(id, { status: 'CLOSED' }, 'Đã đóng ticket');

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

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatusFilter(t.value)}
            className={`chip text-xs ${
              statusFilter === t.value ? 'border-primary/30 bg-primary-soft text-primary' : 'text-muted-2'
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-border" />
        {PRIORITY_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setPriorityFilter(t.value)}
            className={`chip text-xs ${
              priorityFilter === t.value ? 'border-primary/30 bg-primary-soft text-primary' : 'text-muted-2'
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-border" />
        <select
          className="chip text-xs"
          value={assignFilter}
          onChange={(e) => setAssignFilter(e.target.value as 'ALL' | 'unassigned' | 'mine')}
        >
          <option value="ALL">Tất cả người xử lý</option>
          <option value="unassigned">Chưa gán</option>
          <option value="mine">Gán cho tôi</option>
        </select>
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
                  <div className="flex gap-2">
                    <span className={`chip text-xs ${PRIORITY_BADGE[t.priority]}`}>{priorityLabel[t.priority]}</span>
                    <span className={`chip text-xs ${STATUS_BADGE[t.status]}`}>{statusLabel[t.status]}</span>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{t.message}</p>
                {t.reply && (
                  <div className="mt-3 rounded-xl border border-border bg-surface-2 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-2">Phản hồi</p>
                    <p className="whitespace-pre-wrap text-sm">{t.reply}</p>
                  </div>
                )}

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-2" htmlFor={`assign-${t.id}`}>
                      Người xử lý
                    </label>
                    <select
                      id={`assign-${t.id}`}
                      className="input w-full"
                      value={t.assignedToId ?? ''}
                      disabled={busyId === t.id}
                      onChange={(e) =>
                        patch(
                          t.id,
                          { assignedToId: e.target.value || null },
                          e.target.value ? 'Đã gán nhân viên' : 'Đã bỏ gán',
                        )
                      }
                    >
                      <option value="">— Chưa gán —</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name || s.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-2" htmlFor={`prio-${t.id}`}>
                      Ưu tiên
                    </label>
                    <select
                      id={`prio-${t.id}`}
                      className="input w-full"
                      value={t.priority}
                      disabled={busyId === t.id}
                      onChange={(e) => patch(t.id, { priority: e.target.value }, 'Đã đổi ưu tiên')}
                    >
                      <option value="LOW">Thấp</option>
                      <option value="MEDIUM">Trung bình</option>
                      <option value="HIGH">Cao</option>
                    </select>
                  </div>
                </div>

                {t.status !== TicketStatus.CLOSED && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      rows={2}
                      value={replyText[t.id] ?? ''}
                      onChange={(e) => setReplyText((prev) => ({ ...prev, [t.id]: e.target.value }))}
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
