// apps/web/src/components/ui/theme-toggle.tsx
'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { SunIcon, MoonIcon } from './icons';

export default function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      className={cn(
        'inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border text-muted transition-colors hover:border-primary hover:text-foreground',
        className,
      )}
    >
      {mounted && !dark ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
    </button>
  );
}
