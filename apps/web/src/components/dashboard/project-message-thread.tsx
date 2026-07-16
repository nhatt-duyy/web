'use client';
import { useState } from 'react';
import { useApi } from '@/lib/api-client';

interface Message {
  id: string;
  content: string;
  isFromStaff: boolean;
  createdAt: string;
  sender: { name: string };
}

export function ProjectMessageThread({ api, projectId }: {
  api: ReturnType<typeof useApi>;
  projectId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api(`/custom-projects/${projectId}/messages`, { method: 'GET' });
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  // Load 1 lần khi mount (không realtime — chỉ reload khi gửi)
  if (loading && messages.length === 0 && !error) {
    load();
  }

  const send = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await api(`/custom-projects/${projectId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gửi tin nhắn thất bại');
      setMessages((prev) => [...prev, data]);
      setDraft('');
    } catch (err: any) {
      setError(err.message || 'Gửi tin nhắn thất bại');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted">Đang tải tin nhắn…</p>;
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div>}

      <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-border bg-surface p-4">
        {messages.length === 0 && <p className="text-sm text-muted">Chưa có tin nhắn nào. Hãy bắt đầu trao đổi với đội ngũ.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.isFromStaff ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                m.isFromStaff
                  ? 'bg-primary/10 text-foreground'
                  : 'bg-primary text-white'
              }`}
            >
              <p>{m.content}</p>
              <p className={`mt-1 text-[11px] ${m.isFromStaff ? 'text-muted' : 'text-white/70'}`}>
                {m.sender.name} · {new Date(m.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          placeholder="Nhập tin nhắn… (Enter để gửi)"
          className="flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={send}
          disabled={sending || !draft.trim()}
          className="inline-flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:bg-primary-strong disabled:opacity-60"
        >
          {sending ? '…' : 'Gửi'}
        </button>
      </div>
    </div>
  );
}
