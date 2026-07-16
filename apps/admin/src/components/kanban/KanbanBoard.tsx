import { useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
} from '@dnd-kit/core';
import { ProjectCard } from './ProjectCard';
import {
  CustomProject,
  ProjectStatus,
  BOARD_COLUMNS,
  ProjectStatusLabels,
  ProjectStatusStyles,
} from '../../lib/custom-project';

interface KanbanBoardProps {
  projects: CustomProject[];
  onStatusChange: (id: string, status: ProjectStatus) => Promise<void>;
  onCardClick: (project: CustomProject) => void;
}

// Cột Kanban — vừa là container vừa là drop target.
const Column = ({
  status,
  items,
  onCardClick,
}: {
  status: ProjectStatus;
  items: CustomProject[];
  onCardClick: (p: CustomProject) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const style = ProjectStatusStyles[status];
  return (
    <div
      className={`flex w-72 shrink-0 flex-col rounded-2xl border border-border bg-surface/40 ${style.accent} border-l-4`}
    >
      <div className={`flex items-center justify-between rounded-t-2xl px-3 py-2.5 text-xs font-semibold ${style.header}`}>
        <span>{ProjectStatusLabels[status]}</span>
        <span className="rounded-full bg-black/10 px-2 py-0.5 tabular-nums">{items.length}</span>
      </div>
      <div
        ref={setNodeRef}
        data-status={status}
        className={`flex min-h-[120px] flex-1 flex-col gap-2.5 p-2.5 transition-colors ${
          isOver ? 'bg-primary-soft/40' : ''
        }`}
      >
        {items.length === 0 ? (
          <p className="grid flex-1 place-items-center text-xs text-muted-2">Trống</p>
        ) : (
          items.map((p) => <ProjectCard key={p.id} project={p} onClick={onCardClick} />)
        )}
      </div>
    </div>
  );
};

// Board Kanban 7 cột — kéo thả đổi status (optimistic update do parent quản lý).
export const KanbanBoard = ({ projects, onStatusChange, onCardClick }: KanbanBoardProps) => {
  // Group FE 1 lần duy nhất từ array board trả về.
  const grouped = useMemo(() => {
    const map: Record<ProjectStatus, CustomProject[]> = {
      NEW: [],
      QUOTING: [],
      CONFIRMED: [],
      IN_PROGRESS: [],
      REVIEW: [],
      DELIVERED: [],
      WARRANTY: [],
      CANCELLED: [],
    };
    for (const p of projects) {
      if (map[p.status]) map[p.status].push(p);
    }
    return map;
  }, [projects]);

  const sensors = useSensors(
    // Threshold để click (mở panel) không bị hiểu là kéo.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const targetStatus = over.id as ProjectStatus;
    const sourceStatus = active.data.current?.status as ProjectStatus | undefined;
    // Guard kéo trùng cột — không gọi API.
    if (!sourceStatus || sourceStatus === targetStatus) return;
    void onStatusChange(String(active.id), targetStatus);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {BOARD_COLUMNS.map((col) => (
          <Column key={col} status={col} items={grouped[col] ?? []} onCardClick={onCardClick} />
        ))}
      </div>
    </DndContext>
  );
};

export default KanbanBoard;
