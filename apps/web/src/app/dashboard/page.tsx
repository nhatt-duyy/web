'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useApi } from '@/lib/api-client';
import { Container, Spinner, Badge, EmptyState } from '@/components/ui/primitives';
import { ShoppingBagIcon, DownloadIcon, MailIcon, LockIcon, TagIcon, FolderIcon, ArrowRightIcon } from '@/components/ui/icons';
import {
  ProjectStatus,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_STYLES,
  formatVnd,
  MyProject,
} from '@/lib/custom-projects';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const TABS = [
  { id: 'licenses', label: 'License & Tải', icon: <LockIcon className="h-4 w-4" /> },
  { id: 'tickets', label: 'Hỗ trợ', icon: <MailIcon className="h-4 w-4" /> },
  { id: 'orders', label: 'Đơn hàng', icon: <ShoppingBagIcon className="h-4 w-4" /> },
  { id: 'projects', label: 'Dự án của tôi', icon: <FolderIcon className="h-4 w-4" /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const api = useApi();
  const [tab, setTab] = useState<TabId>('licenses');

  if (status === 'loading') {
    return (
      <>
        <Header />
        <main className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </main>
        <Footer />
      </>
    );
  }

  if (status !== 'authenticated') {
    const callbackUrl = encodeURIComponent('/dashboard');
    router.push(`/api/auth/signin?callbackUrl=${callbackUrl}`);
    return (
      <>
        <Header />
        <main className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <p className="text-muted">Đang chuyển hướng đến trang đăng nhập...</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="py-10">
        <Container>
          <nav className="mb-3 flex items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-primary">
              Trang chủ
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">Tài khoản</span>
          </nav>

          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Bảng điều khiển</h1>
              <p className="mt-2 text-muted">
                {session.user?.name ? `Xin chào, ${session.user.name}. ` : ''}Quản lý license, yêu cầu hỗ trợ và lịch sử đơn hàng.
              </p>
            </div>
            <p className="text-sm text-muted-2">{session.user?.email}</p>
          </div>

          <div
            role="tablist"
            aria-label="Bảng điều khiển"
            className="mb-8 flex flex-wrap gap-1 border-b border-border"
          >
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4 ${
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:text-foreground'
                  }`}
                >
                  {t.icon}
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </div>

          <section role="tabpanel" hidden={tab !== 'licenses'}>
            {tab === 'licenses' && <LicensesTab api={api} />}
          </section>
          <section role="tabpanel" hidden={tab !== 'tickets'}>
            {tab === 'tickets' && <TicketsTab api={api} />}
          </section>
          <section role="tabpanel" hidden={tab !== 'orders'}>
            {tab === 'orders' && <OrdersTab api={api} />}
          </section>
          <section role="tabpanel" hidden={tab !== 'projects'}>
            {tab === 'projects' && <ProjectsTab api={api} session={session} />}
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}

/* ---------------- Tab License & Tải ---------------- */
function LicensesTab({ api }: { api: ReturnType<typeof useApi> }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; text: string } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api('/licenses', { method: 'GET' });
      const data = await res.json();
      setLicenses(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách license');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = async (id: string) => {
    setBusyId(id);
    setMsg(null);
    try {
      const res = await api(`/licenses/${id}/download`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Tải thất bại');
      // Mở link đã ký (5 phút hiệu lực)
      window.open(data.url, '_blank');
      setLicenses((prev) =>
        prev.map((l) => (l.id === id ? { ...l, downloadCount: data.downloadCount } : l)),
      );
    } catch (err: any) {
      setMsg({ id, text: err.message || 'Tải thất bại' });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger">{error}</div>;
  }

  if (licenses.length === 0) {
    return (
      <EmptyState
        icon={<LockIcon className="h-7 w-7" />}
        title="Chưa có license nào"
        description="Sau khi thanh toán thành công, license tải source sẽ xuất hiện tại đây."
        action={
          <Link
            href="/products"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-white transition-colors hover:bg-primary-strong"
          >
            Khám phá sản phẩm
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {licenses.map((l) => {
        const remaining = (l.downloadLimit || 5) - (l.downloadCount || 0);
        const canDownload = remaining > 0;
        return (
          <div
            key={l.id}
            className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-strong hover:bg-surface-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-base font-semibold">{l.product?.title || 'Sản phẩm'}</p>
                <p className="mt-0.5 text-sm text-muted">
                  {l.tier?.name ? `Gói: ${l.tier.name} · ` : ''}
                  Còn {remaining}/{l.downloadLimit || 5} lượt tải
                </p>
              </div>
              <button
                onClick={() => handleDownload(l.id)}
                disabled={!canDownload || busyId === l.id}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50"
              >
                <DownloadIcon className="h-4 w-4" />
                {busyId === l.id ? 'Đang tải...' : canDownload ? 'Tải source' : 'Hết lượt'}
              </button>
            </div>
            {msg && msg.id === l.id && <p className="mt-3 text-sm text-danger">{msg.text}</p>}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Tab Hỗ trợ (Tickets) ---------------- */
function TicketsTab({ api }: { api: ReturnType<typeof useApi> }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api('/tickets/my', { method: 'GET' });
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusTone = (s?: string): 'success' | 'warning' | 'soft' => {
    if (s === 'CLOSED') return 'soft';
    if (s === 'REPLIED') return 'success';
    return 'warning';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg(null);
    try {
      const res = await api('/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, priority }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Gửi thất bại');
      }
      setSubject('');
      setMessage('');
      setFormMsg('Đã gửi yêu cầu. Chúng tôi sẽ phản hồi sớm.');
      load();
    } catch (err: any) {
      setFormMsg(err.message || 'Gửi thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="mb-4 font-display text-lg font-bold">Gửi yêu cầu hỗ trợ</h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="ticket-subject" className="mb-1.5 block text-sm font-medium">
              Tiêu đề
            </label>
            <input
              id="ticket-subject"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input"
              placeholder="VD: Lỗi tải file sau khi thanh toán"
            />
          </div>
          <div>
            <label htmlFor="ticket-message" className="mb-1.5 block text-sm font-medium">
              Nội dung
            </label>
            <textarea
              id="ticket-message"
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input resize-y"
              placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
            />
          </div>
          <div>
            <label htmlFor="ticket-priority" className="mb-1.5 block text-sm font-medium">
              Mức độ ưu tiên
            </label>
            <select
              id="ticket-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
              className="input"
            >
              <option value="LOW">Thấp</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HIGH">Cao</option>
            </select>
          </div>
          {formMsg && (
            <p className="text-sm text-primary" role="status">
              {formMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-strong disabled:opacity-50"
          >
            <TagIcon className="h-4 w-4" />
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </div>
      </form>

      {error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger">{error}</div>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-muted">Chưa có yêu cầu hỗ trợ nào.</p>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-base font-semibold">{t.subject}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-2">{t.priority || 'MEDIUM'}</span>
                  <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{t.message}</p>
              {t.reply && (
                <div className="mt-3 rounded-xl border border-border bg-surface-2 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-2">
                    Phản hồi từ admin
                  </p>
                  <p className="whitespace-pre-wrap text-sm">{t.reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Tab Đơn hàng ---------------- */
function OrdersTab({ api }: { api: ReturnType<typeof useApi> }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api('/orders/mine', { method: 'GET' });
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : data.data || []);
      } catch (err: any) {
        setError(err.message || 'Không thể tải đơn hàng');
      } finally {
        setLoading(false);
      }
    })();
  }, [api]);

  const statusTone = (s?: string): 'success' | 'danger' | 'warning' => {
    if (s === 'PAID' || s === 'CONFIRMED') return 'success';
    if (s === 'CANCELLED' || s === 'FAILED') return 'danger';
    return 'warning';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger">{error}</div>;
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBagIcon className="h-7 w-7" />}
        title="Chưa có đơn hàng nào"
        description="Khi bạn mua source code, đơn hàng sẽ hiển thị tại đây."
        action={
          <Link
            href="/products"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-white transition-colors hover:bg-primary-strong"
          >
            Khám phá sản phẩm
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const items = Array.isArray(order.items) ? order.items : [];
        const count = items.reduce((sum: number, it: any) => sum + (it.qty || 1), 0);
        const date = order.createdAt
          ? new Date(order.createdAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : '';
        return (
          <div
            key={order.id}
            className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-strong hover:bg-surface-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-base font-semibold">Đơn #{order.id}</p>
                <p className="mt-0.5 text-sm text-muted">
                  {date}
                  {count > 0 && ` · ${count} sản phẩm`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-lg font-bold">{formatPrice(order.total || 0)}</span>
                <Badge tone={statusTone(order.status)}>{order.status}</Badge>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Tab Dự án của tôi (Phase 4) ---------------- */
function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PROJECT_STATUS_STYLES[status]}`}
    >
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}

function ProjectsTab({
  api,
  session,
}: {
  api: ReturnType<typeof useApi>;
  session: any;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<MyProject[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api('/custom-projects/my', { method: 'GET' });
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách dự án');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger">{error}</div>;
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<FolderIcon className="h-7 w-7" />}
        title="Chưa có dự án nào"
        description="Bạn có thể gửi yêu cầu báo giá dịch vụ custom để bắt đầu."
        action={
          <Link
            href="/bao-gia"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-white transition-colors hover:bg-primary-strong"
          >
            Gửi yêu cầu báo giá
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((p) => {
        const paid = p.milestones.filter((m) => m.status === 'PAID').reduce((s, m) => s + m.amount, 0);
        const total = p.milestones.reduce((s, m) => s + m.amount, 0);
        return (
          <div
            key={p.id}
            className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-strong hover:bg-surface-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link
                  href={`/dashboard/projects/${p.id}`}
                  className="font-display text-base font-semibold transition-colors hover:text-primary"
                >
                  {p.title}
                </Link>
                <p className="mt-0.5 text-sm text-muted">
                  {p.assignee ? `Phụ trách: ${p.assignee.name} · ` : ''}
                  {formatVnd(p.quotedAmount)}
                </p>
              </div>
              <StatusBadge status={p.status} />
            </div>

            {p.milestones.length > 0 && (
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs text-muted">
                  <span>Tiến độ thanh toán</span>
                  <span>
                    {formatVnd(paid)} / {formatVnd(total)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${total > 0 ? Math.round((paid / total) * 100) : 0}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center gap-4 text-xs text-muted">
              <span>{p._count?.messages ?? 0} tin nhắn</span>
              <span>{p._count?.files ?? 0} file</span>
              <Link
                href={`/dashboard/projects/${p.id}`}
                className="ml-auto inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                Chi tiết <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
