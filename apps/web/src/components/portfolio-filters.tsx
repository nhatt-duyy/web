'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';
import { PROJECT_TYPE_OPTIONS } from '@/lib/custom-projects';

/**
 * Filter danh mục portfolio theo ProjectType (query param ?type=).
 * Tái dùng style Chip giống Filters của trang products.
 */
export default function PortfolioFilters({ counts }: { counts: Record<string, number> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get('type') ?? '';

  const go = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type) params.set('type', type);
    else params.delete('type');
    router.push(`/du-an${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <div className="flex flex-wrap gap-2.5">
      <button
        type="button"
        onClick={() => go('')}
        aria-pressed={active === ''}
        className={cn('chip cursor-pointer', active === '' && 'chip-active')}
      >
        Tất cả {counts[''] ? `(${counts['']})` : ''}
      </button>
      {PROJECT_TYPE_OPTIONS.map((opt) => {
        const count = counts[opt.value] ?? 0;
        if (count === 0) return null; // Ẩn loại không có dự án nào
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => go(opt.value)}
            aria-pressed={active === opt.value}
            className={cn('chip cursor-pointer', active === opt.value && 'chip-active')}
          >
            {opt.label} ({count})
          </button>
        );
      })}
    </div>
  );
}
