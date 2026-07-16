import { useCallback, useEffect, useState } from 'react';
import apiClient from '../lib/api-client';
import KanbanBoard from '../components/kanban/KanbanBoard';
import ProjectPanel from '../components/kanban/ProjectPanel';
import {
  CustomProject,
  ProjectStatus,
  StaffUser,
  ProjectStatusLabels,
  priorityLabels,
} from '../lib/custom-project';

const CustomProjects = () => {
  const [projects, setProjects] = useState<CustomProject[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<'ALL' | 'unassigned' | string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | CustomProject['priority']>('ALL');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedInitial, setSelectedInitial] = useState<CustomProject | null>(null);

  const currentUserId = (() => {
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
      /* bỏ qua */
    }
  }, []);

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      if (assigneeFilter === 'unassigned') params.assigneeId = 'unassigned';
      else if (assigneeFilter !== 'ALL') params.assigneeId = assigneeFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      const { data } = await apiClient.get<CustomProject[]>('/custom-projects/board', { params });
      setProjects(data);
    } catch (error: any) {
      setNotification({
        message: error.response?.data?.message || 'Không thể tải bảng dự án',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [search, assigneeFilter, priorityFilter]);

  useEffect(() => {
    fetchBoard();
    fetchStaff();
  }, [fetchBoard, fetchStaff]);

  // Drag-drop đổi status — optimistic update + rollback nếu PATCH lỗi.
  const handleStatusChange = useCallback(
    async (id: string, status: ProjectStatus) => {
      const prev = projects;
      // Optimistic: chuyển card ngay lập tức.
      setProjects((list) => list.map((p) => (p.id === id ? { ...p, status } : p)));
      try {
        await apiClient.patch(`/custom-projects/${id}`, { status });
        setNotification({
          message: `Đã chuyển sang ${ProjectStatusLabels[status]}`,
          type: 'success',
        });
      } catch (error: any) {
        // Rollback.
        setProjects(prev);
        setNotification({
          message: error.response?.data?.message || 'Cập nhật trạng thái thất bại',
          type: 'error',
        });
      }
    },
    [projects],
  );

  const openPanel = (project: CustomProject) => {
    setSelectedId(project.id);
    setSelectedInitial(project);
  };

  const handleSaved = (updated: { assigneeId?: string | null; deadline?: string; priority?: CustomProject['priority'] }) => {
    setProjects((list) =>
      list.map((p) =>
        p.id === selectedId
          ? {
              ...p,
              ...updated,
              assignee: updated.assigneeId
                ? staff.find((s) => s.id === updated.assigneeId) ?? p.assignee
                : null,
            }
          : p,
      ),
    );
    if (selectedInitial) setSelectedInitial({ ...selectedInitial, ...updated, assignee: updated.assigneeId ? staff.find((s) => s.id === updated.assigneeId) ?? selectedInitial.assignee : null });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Dự án Custom</h1>
        <p className="mt-1 text-sm text-muted">Quản lý tiến độ dịch vụ thiết kế &amp; phát triển theo Kanban</p>
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
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm dự án..."
          className="input w-56"
        />
        <select className="chip text-xs" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as any)}>
          <option value="ALL">Mọi ưu tiên</option>
          {Object.entries(priorityLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select className="chip text-xs" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
          <option value="ALL">Tất cả người phụ trách</option>
          <option value="unassigned">Chưa gán</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.email}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-sm text-muted">Đang tải bảng...</div>
      ) : (
        <KanbanBoard projects={projects} onStatusChange={handleStatusChange} onCardClick={openPanel} />
      )}

      {selectedId && selectedInitial && (
        <ProjectPanel
          projectId={selectedId}
          initial={selectedInitial}
          staff={staff}
          currentUserId={currentUserId}
          onClose={() => setSelectedId(null)}
          onSaved={handleSaved}
          onNotify={(message, type) => setNotification({ message, type })}
        />
      )}
    </div>
  );
};

export default CustomProjects;
