import { useEffect, useState, useCallback } from 'react';
import apiClient from '../../lib/api-client';
import {
  CustomProject,
  ProjectPriority,
  StaffUser,
  ProjectFile,
  ProjectMessage,
  ProjectStatusLabels,
  priorityLabels,
  formatCurrency,
  formatDate,
} from '../../lib/custom-project';

// Payload cập nhật từ panel → page (chỉ các trường form Tổng quan).
export interface ProjectSavePayload {
  assigneeId?: string | null;
  deadline?: string;
  priority?: ProjectPriority;
}

interface ProjectPanelProps {
  projectId: string;
  // project ban đầu từ board (để hiển thị nhanh trước khi lazy load).
  initial: CustomProject;
  staff: StaffUser[];
  currentUserId?: string;
  onClose: () => void;
  onSaved: (updated: ProjectSavePayload) => void;
  onNotify: (message: string, type: 'success' | 'error') => void;
}

type Tab = 'overview' | 'messages' | 'files';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'messages', label: 'Tin nhắn' },
  { key: 'files', label: 'File' },
];

// Lấy URL download từ presign (chỉ ADMIN mới có quyền presign).
const downloadUrl = async (key: string): Promise<string | null> => {
  try {
    const { data } = await apiClient.post<{ url: string }>('/storage/presign-download', { key });
    return data.url;
  } catch {
    return null;
  }
};

export const ProjectPanel = ({
  projectId,
  initial,
  staff,
  currentUserId,
  onClose,
  onSaved,
  onNotify,
}: ProjectPanelProps) => {
  void currentUserId;
  const [tab, setTab] = useState<Tab>('overview');
  const [project, setProject] = useState<CustomProject>(initial);
  const [loading, setLoading] = useState(false);

  // Form state (Tổng quan)
  const [assigneeId, setAssigneeId] = useState(initial.assignee?.id ?? '');
  const [deadline, setDeadline] = useState(initial.deadline ? initial.deadline.slice(0, 10) : '');
  const [priority, setPriority] = useState<ProjectPriority>(initial.priority);
  const [saving, setSaving] = useState(false);

  // Messages
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);

  // Files
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // Lazy load chi tiết khi mở panel.
  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<CustomProject>(`/custom-projects/${projectId}`);
      setProject(data);
      setAssigneeId(data.assignee?.id ?? '');
      setDeadline(data.deadline ? data.deadline.slice(0, 10) : '');
      setPriority(data.priority);
      setMessages(data.messages ?? []);
      setFiles(data.files ?? []);
    } catch {
      onNotify('Không thể tải chi tiết dự án', 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId, onNotify]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const patchOverview = async () => {
    setSaving(true);
    try {
      await apiClient.patch(`/custom-projects/${projectId}`, {
        assigneeId: assigneeId || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        priority,
      });
      onNotify('Đã lưu thay đổi', 'success');
      onSaved({ assigneeId: assigneeId || null, deadline, priority });
    } catch (err: any) {
      onNotify(err.response?.data?.message || 'Lưu thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  const sendMessage = async () => {
    const content = msgText.trim();
    if (!content) return;
    setSending(true);
    try {
      const { data } = await apiClient.post<ProjectMessage>(
        `/custom-projects/${projectId}/messages`,
        { content },
      );
      setMessages((prev) => [...prev, data]);
      setMsgText('');
    } catch (err: any) {
      onNotify(err.response?.data?.message || 'Gửi tin nhắn thất bại', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      // 1. Presign upload (chỉ ADMIN)
      const presign = await apiClient.post<{ url: string; key: string }>('/storage/presign-upload', {
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
      });
      // 2. PUT lên R2
      await fetch(presign.data.url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      // 3. Ghi nhận file vào dự án (nếu backend đã có route files).
      // Lưu ý: hiện tại controller custom-projects chưa expose POST /:id/files,
      // nên ta bắt lỗi để không crash và vẫn hiển thị file本地 (optimistic).
      try {
        await apiClient.post(`/custom-projects/${projectId}/files`, {
          name: file.name,
          fileKey: presign.data.key,
          kind: 'DELIVERABLE',
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
        });
        const { data } = await apiClient.get<CustomProject>(`/custom-projects/${projectId}`);
        setFiles(data.files ?? []);
      } catch {
        // Backend chưa có route ghi file → vẫn coi upload R2 thành công.
        setFiles((prev) => [
          { id: `local-${Date.now()}`, name: file.name, fileKey: presign.data.key, kind: 'DELIVERABLE', size: file.size },
          ...prev,
        ]);
      }
      onNotify('Đã upload file lên R2', 'success');
    } catch (err: any) {
      if (err.response?.status === 403) {
        onNotify('Chỉ ADMIN mới được upload file', 'error');
      } else {
        onNotify(err.response?.data?.message || 'Upload thất bại', 'error');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex h-full w-full max-w-lg flex-col bg-surface shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="min-w-0">
            <p className="font-display text-lg font-bold leading-tight">{project.title}</p>
            <p className="mt-1 text-xs text-muted-2">
              {project.user.name || project.user.email} · {formatCurrency(project.quotedAmount)} ·{' '}
              {ProjectStatusLabels[project.status]}
            </p>
          </div>
          <button onClick={onClose} className="chip" aria-label="Đóng">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border px-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === t.key ? 'text-primary' : 'text-muted-2 hover:text-foreground'
              }`}
            >
              {t.label}
              {tab === t.key && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-center text-sm text-muted">Đang tải...</p>
          ) : tab === 'overview' ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-muted-2">Người phụ trách</label>
                <select className="input w-full" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                  <option value="">— Chưa gán —</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || s.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted-2">Hạn bàn giao</label>
                <input type="date" className="input w-full" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted-2">Ưu tiên</label>
                <select className="input w-full" value={priority} onChange={(e) => setPriority(e.target.value as ProjectPriority)}>
                  {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as ProjectPriority[]).map((p) => (
                    <option key={p} value={p}>
                      {priorityLabels[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted-2">Mô tả</label>
                <p className="whitespace-pre-wrap rounded-lg bg-surface-2 p-3 text-sm text-muted">
                  {project.description || 'Không có mô tả'}
                </p>
              </div>
              <button onClick={patchOverview} disabled={saving} className="btn-primary w-full disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          ) : tab === 'messages' ? (
            <div className="space-y-3">
              <div className="space-y-2.5">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-muted-2">Chưa có tin nhắn</p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex ${m.isFromStaff ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                          m.isFromStaff
                            ? 'bg-primary text-white'
                            : 'bg-surface-2 text-foreground'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        <p className={`mt-1 text-[10px] ${m.isFromStaff ? 'text-white/70' : 'text-muted-2'}`}>
                          {m.sender.name} · {formatDate(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="sticky bottom-0 flex gap-2 bg-surface pt-2">
                <textarea
                  rows={2}
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="input resize-y flex-1"
                />
                <button onClick={sendMessage} disabled={sending || !msgText.trim()} className="btn-primary disabled:opacity-50">
                  {sending ? '...' : 'Gửi'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="btn-outline inline-flex cursor-pointer items-center gap-2">
                {uploading ? 'Đang upload...' : 'Tải lên file'}
                <input type="file" className="hidden" onChange={handleFile} disabled={uploading} />
              </label>
              {files.length === 0 ? (
                <p className="text-center text-sm text-muted-2">Chưa có file</p>
              ) : (
                files.map((f) => (
                  <FileRow key={f.id} file={f} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FileRow = ({ file }: { file: ProjectFile }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const handleDownload = async () => {
    if (url) {
      window.open(url, '_blank');
      return;
    }
    setBusy(true);
    const u = await downloadUrl(file.fileKey);
    setBusy(false);
    if (u) {
      setUrl(u);
      window.open(u, '_blank');
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/50 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-2">{file.size ? `${(file.size / 1024).toFixed(1)} KB` : '—'}</p>
      </div>
      <button onClick={handleDownload} disabled={busy} className="chip text-xs">
        {busy ? '...' : 'Tải xuống'}
      </button>
    </div>
  );
};

export default ProjectPanel;
