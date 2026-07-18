'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import AuthShell from '@/components/auth-shell';
import { Input, Spinner } from '@/components/ui/primitives';
import {
  GoogleIcon,
  GithubIcon,
  MailIcon,
  LockIcon,
  ArrowRightIcon,
} from '@/components/ui/icons';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<'google' | 'github' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError('Email hoặc mật khẩu không chính xác.');
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  };

  const handleOAuth = (provider: 'google' | 'github') => {
    setOauthBusy(provider);
    signIn(provider, { callbackUrl });
  };

  const busy = loading || oauthBusy !== null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-7 shadow-[var(--shadow-card)] sm:p-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Đăng nhập</h1>
      <p className="mt-2 text-sm text-muted">Chào mừng trở lại! Đăng nhập để tiếp tục mua sắm.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={busy}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary-soft focus-visible:border-primary active:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {oauthBusy === 'google' ? <Spinner className="h-4 w-4" /> : <GoogleIcon className="h-5 w-5" />} Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuth('github')}
          disabled={busy}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary-soft focus-visible:border-primary active:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {oauthBusy === 'github' ? <Spinner className="h-4 w-4" /> : <GithubIcon className="h-5 w-5" />} GitHub
        </button>
      </div>

      <div className="my-5 flex items-center gap-3 text-xs font-medium text-muted">
        <span className="h-px flex-1 bg-border" /> hoặc đăng nhập bằng email{' '}
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            id="login-error"
            className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
            Email
          </label>
          <div className="relative">
            <MailIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-2" />
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="ban@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              aria-invalid={error ? true : undefined}
              className={`pl-10 disabled:cursor-not-allowed disabled:opacity-60 ${error ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/30' : ''}`}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
            Mật khẩu
          </label>
          <div className="relative">
            <LockIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-2" />
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              aria-invalid={error ? true : undefined}
              className={`pl-10 disabled:cursor-not-allowed disabled:opacity-60 ${error ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/30' : ''}`}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          aria-busy={loading}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-white transition-colors hover:bg-primary-strong active:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <>
              <Spinner className="h-5 w-5 text-white" /> Đang đăng nhập…
            </>
          ) : (
            <>
              Đăng nhập <ArrowRightIcon className="h-5 w-5" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="font-semibold text-primary transition-colors hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
