// apps/web/src/components/ui/reveal.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

// Hiệu ứng reveal khi cuộn vào viewport (tôn trọng prefers-reduced-motion).
export default function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Component = Tag as any;
  return (
    <Component
      ref={ref}
      className={cn(
        'transition-all duration-700',
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        className,
      )}
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
    >
      {children}
    </Component>
  );
}
