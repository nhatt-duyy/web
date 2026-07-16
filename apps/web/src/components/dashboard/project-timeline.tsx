'use client';
import { ProjectStatus, PROJECT_STATUS_LABELS, PROJECT_PIPELINE } from '@/lib/custom-projects';

/** Timeline pipeline 7 bước cho dự án custom. */
export function ProjectTimeline({ current }: { current: ProjectStatus }) {
  const idx = PROJECT_PIPELINE.indexOf(current);
  return (
    <ol className="flex flex-wrap gap-2">
      {PROJECT_PIPELINE.map((step, i) => {
        const done = i < idx || current === 'DELIVERED' || current === 'WARRANTY';
        const active = i === idx;
        return (
          <li key={step} className="flex flex-1 min-w-[110px] items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                done
                  ? 'border-primary bg-primary text-white'
                  : active
                    ? 'border-primary text-primary'
                    : 'border-border text-muted'
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-xs ${active ? 'font-semibold text-foreground' : 'text-muted'}`}>
              {PROJECT_STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
