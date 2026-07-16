import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  CustomProject,
  priorityLabels,
  priorityStyles,
  formatCurrency,
  formatDate,
} from '../../lib/custom-project';

interface ProjectCardProps {
  project: CustomProject;
  onClick: (project: CustomProject) => void;
}

// Card dự án trong cột Kanban — kéo thả đổi status.
export const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
    data: { status: project.status },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    // Giảm opacity khi đang kéo để user thấy rõ vị trí thả.
    opacity: isDragging ? 0.4 : 1,
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(project)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(project);
        }
      }}
      className="card cursor-grab p-3.5 text-left transition-shadow hover:shadow-[0_12px_30px_-16px_var(--glow)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-sm font-semibold leading-snug">{project.title}</p>
        <span className={`chip shrink-0 text-[10px] ${priorityStyles[project.priority]}`}>
          {priorityLabels[project.priority]}
        </span>
      </div>

      <p className="mt-1.5 text-xs text-muted-2">
        {project.user.name || project.user.email}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <span className="font-semibold text-foreground">{formatCurrency(project.quotedAmount)}</span>
        {project.deadline && (
          <>
            <span className="text-muted-2">·</span>
            <span>📅 {formatDate(project.deadline)}</span>
          </>
        )}
      </div>

      {project.assignee && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">
            {(project.assignee.name || project.assignee.email).slice(0, 1).toUpperCase()}
          </span>
          <span className="truncate text-xs text-muted-2">{project.assignee.name || project.assignee.email}</span>
        </div>
      )}
    </div>
  );
};

export default ProjectCard;
