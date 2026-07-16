import Link from 'next/link';
import { Badge } from '@/components/ui/primitives';
import { ArrowRightIcon } from '@/components/ui/icons';
import {
  type ShowcaseProject,
  PROJECT_TYPE_LABELS,
  r2PublicUrl,
} from '@/lib/custom-projects';

/**
 * Card portfolio tái dùng pattern của ProductCard:
 * thumbnail (file DELIVERABLE đầu tiên hoặc fallback), badge loại dự án,
 * tiêu đề, excerpt mô tả, link sang detail /du-an/[slug].
 */
export default function PortfolioCard({ project }: { project: ShowcaseProject }) {
  const thumbnail = project.files?.[0]?.fileKey
    ? r2PublicUrl(project.files[0].fileKey)
    : null;
  const typeLabel = project.request ? PROJECT_TYPE_LABELS[project.request.type] : 'Khác';
  const excerpt = project.description
    ? project.description.length > 120
      ? `${project.description.slice(0, 120)}…`
      : project.description
    : 'Xem chi tiết dự án đã triển khai.';

  return (
    <Link
      href={`/du-an/${project.slug ?? project.id}`}
      aria-label={project.title}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgb(15_23_42/0.04),0_8px_24px_-16px_rgb(15_23_42/0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-[0_24px_50px_-28px_rgb(var(--shadow-color)/0.6)]"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={project.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-2">
            Chưa có ảnh bàn giao
          </div>
        )}

        <Badge tone="soft" className="absolute left-3 top-3 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {typeLabel}
        </Badge>

        <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-surface/90 text-foreground opacity-0 shadow-sm backdrop-blur transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          <ArrowRightIcon className="h-4 w-4" />
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 font-display text-base font-semibold text-foreground transition-colors group-hover:text-primary">
          {project.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
          {excerpt}
        </p>
        {project.user?.name && (
          <span className="mt-4 text-xs text-muted-2">Khách hàng: {project.user.name}</span>
        )}
      </div>
    </Link>
  );
}
