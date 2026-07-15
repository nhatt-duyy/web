// apps/web/src/components/ui/primitives.tsx
import Link from 'next/link';
import { cn } from '@/lib/cn';

/* ---------------- Container ---------------- */
export function Container({
  className,
  children,
  as: Tag = 'div',
}: {
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}) {
  const Component = (Tag ?? 'div') as React.ElementType;
  return (
    <Component className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </Component>
  );
}

/* ---------------- Button ---------------- */
type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white shadow-[0_10px_30px_-12px_var(--glow)] hover:bg-primary-strong hover:-translate-y-px active:translate-y-0',
  outline:
    'border border-border-strong text-foreground hover:border-primary hover:bg-primary-soft',
  ghost: 'text-muted hover:text-foreground hover:bg-surface-2',
  danger: 'bg-danger text-white hover:opacity-90',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
};

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  href,
  children,
  ...props
}: CommonProps & { href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

/* ---------------- Badge ---------------- */
type BadgeTone = 'primary' | 'soft' | 'outline' | 'success' | 'warning' | 'danger';

const BADGES: Record<BadgeTone, string> = {
  primary: 'bg-primary text-white',
  soft: 'bg-primary-soft text-primary',
  outline: 'border border-border-strong text-muted',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
};

export function Badge({
  tone = 'soft',
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        BADGES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------------- Card ---------------- */
export function Card({
  className,
  hover = false,
  children,
  ...props
}: {
  className?: string;
  hover?: boolean;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card', hover && 'card-hover', className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

/* ---------------- Section heading ---------------- */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
  action,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-end justify-between gap-4',
        align === 'center' && 'flex-col items-center text-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && (
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
        )}
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        {description && <p className="mt-3 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------- Chip ---------------- */
export function Chip({
  className,
  active = false,
  children,
  ...props
}: {
  className?: string;
  active?: boolean;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn('chip cursor-pointer', active && 'chip-active', className)}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------------- Input ---------------- */
export function Input({
  className,
  ...props
}: { className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('input', className)} {...props} />;
}

/* ---------------- Select ---------------- */
export function Select({
  className,
  children,
  ...props
}: { className?: string; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'cursor-pointer rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

/* ---------------- Divider ---------------- */
export function Divider({ className }: { className?: string }) {
  return <div className={cn('divider', className)} />;
}

/* ---------------- Spinner ---------------- */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-5 w-5 animate-spin text-primary', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-90"
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------------- Skeleton ---------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}

/* ---------------- Empty state ---------------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface/40 px-6 py-16 text-center">
      {icon && (
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          {icon}
        </div>
      )}
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {description && <p className="mt-2 text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
