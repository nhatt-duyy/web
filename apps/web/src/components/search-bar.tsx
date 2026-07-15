'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';
import { SearchIcon } from '@/components/ui/icons';

interface SearchBarProps {
  className?: string;
}

function SearchBarInner({ className }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('q') ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Đồng bộ khi URL đổi từ bên ngoài
  useEffect(() => {
    setValue(searchParams.get('q') ?? '');
  }, [searchParams]);

  const submit = (q: string) => {
    const trimmed = q.trim();
    router.push(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : '/products');
  };

  const onChange = (v: string) => {
    setValue(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => submit(v), 400);
  };

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        submit(value);
      }}
      className={cn('relative', className)}
    >
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tìm source code..."
        aria-label="Tìm kiếm sản phẩm"
        className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
      />
    </form>
  );
}

/**
 * Ô tìm kiếm ở header. Bọc Suspense vì dùng useSearchParams (yêu cầu Next khi prerender).
 */
export default function SearchBar(props: SearchBarProps) {
  return (
    <Suspense fallback={null}>
      <SearchBarInner {...props} />
    </Suspense>
  );
}
