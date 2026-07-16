'use client';

import { useEffect, useMemo, useState } from 'react';
import { type ProjectType, type ShowcaseProject, PROJECT_TYPE_LABELS } from '@/lib/custom-projects';

/**
 * Hook fetch portfolio (GET /api/custom-projects?showcase=true) và hỗ trợ filter theo loại dự án.
 * Dùng cho client component khi cần filter tương tác (trang /du-an dùng server component để SEO,
 * nhưng hook này vẫn được export để tái dùng / filter mềm phía client nếu cần).
 */
export function usePortfolio(initialType?: ProjectType) {
  const [data, setData] = useState<ShowcaseProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [type, setType] = useState<ProjectType | ''>(initialType ?? '');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set('showcase', 'true');
    if (type) params.set('type', type);
    params.set('limit', '24');
    fetch(`/api/custom-projects?${params.toString()}`, {
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Lỗi ${res.status}`);
        return (await res.json()) as ShowcaseProject[];
      })
      .then((json) => {
        if (isMounted) setData(json ?? []);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err : new Error('Lỗi tải portfolio'));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [type]);

  // Đếm số lượng theo từng loại (cho chip filter).
  const counts = useMemo(() => {
    const map: Record<string, number> = { '': data.length };
    for (const p of data) {
      const t = p.request?.type ?? 'OTHER';
      map[t] = (map[t] ?? 0) + 1;
    }
    return map;
  }, [data]);

  const labelFor = (t: ProjectType) => PROJECT_TYPE_LABELS[t];

  return { data, loading, error, type, setType, counts, labelFor };
}
