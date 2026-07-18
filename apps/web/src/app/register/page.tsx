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
  UserIcon,
  MailIcon,
  LockIcon,
  ArrowRightIcon,
  ShieldIcon,
} from '@/components/ui/icons';

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/';
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [loading, setLoading] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<'google' | 'github' | null>(null);

  const setField = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<keyof typeof form, string>> = {};
    if (!form.name.trim()) next.name = 'Vui lòng nhập họ và tên.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Email không hợp lệ.';
    if (form.password.length < 6) next.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    if (form.confirm !== form.password) next.confirm = 'Mật khẩu xác nhận không khớp.';
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const next = validate();
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message;
        setError(
          typeof msg === 'string'
            ? msg
            : Array.isArray(msg)
              ? msg.join(', ')
              : 'Đăng ký không thành công.',
        );
        return;
      }
      const loginRes = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (loginRes?.error) {
        router.push('/login');
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'github') => {
    setOauthBusy(provider);
    signIn(provider, { callbackUrl });
  };

  const busy = loading || oauthBusy !== null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-7 shadow-[var(--shadow-card)] sm:p-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Tạo tài khoản</h1>
      <p className="mt-2 text-sm text-muted">Tham gia Nhat Duy Market để tải source code và theo dõi đơn hàng.</p>

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
        <span className="h-px flex-1 bg-border" /> hoặc đăng ký bằng email{' '}
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            id="register-error"
            className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
            Họ và tên
          </label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-2" />
            <Input
              id="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Nguyễn Văn A"
              value={form.name}
              onChange={setField('name')}
              disabled={busy}
              aria-invalid={fieldErrors.name ? true : undefined}
              aria-describedby={fieldErrors.name ? 'name-error' : error ? 'register-error' : undefined}
              className={`pl-10 disabled:cursor-not-allowed disabled:opacity-60 ${fieldErrors.name ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/30' : ''}`}
            />
          </div>
          {fieldErrors.name && (
            <p id="name-error" className="mt-1.5 text-xs text-danger">{fieldErrors.name}</p>
          )}
        </div>

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
              value={form.email}
              onChange={setField('email')}
              disabled={busy}
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby={fieldErrors.email ? 'email-error' : error ? 'register-error' : undefined}
              className={`pl-10 disabled:cursor-not-allowed disabled:opacity-60 ${fieldErrors.email ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/30' : ''}`}
            />
          </div>
          {fieldErrors.email && (
            <p id="email-error" className="mt-1.5 text-xs text-danger">{fieldErrors.email}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
                autoComplete="new-password"
                placeholder="••••••••"
                value={form.password}
                onChange={setField('password')}
                disabled={busy}
                aria-invalid={fieldErrors.password ? true : undefined}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                className={`pl-10 disabled:cursor-not-allowed disabled:opacity-60 ${fieldErrors.password ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/30' : ''}`}
              />
            </div>
            {fieldErrors.password && (
              <p id="password-error" className="mt-1.5 text-xs text-danger">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-foreground">
              Xác nhận
            </label>
            <div className="relative">
              <LockIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-2" />
              <Input
                id="confirm"
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={setField('confirm')}
                disabled={busy}
                aria-invalid={fieldErrors.confirm ? true : undefined}
                aria-describedby={fieldErrors.confirm ? 'confirm-error' : undefined}
                className={`pl-10 disabled:cursor-not-allowed disabled:opacity-60 ${fieldErrors.confirm ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/30' : ''}`}
              />
            </div>
            {fieldErrors.confirm && (
              <p id="confirm-error" className="mt-1.5 text-xs text-danger">{fieldErrors.confirm}</p>
            )}
          </div>
        </div>

        <p className="flex items-start gap-2 text-xs text-muted">
          <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Bằng việc đăng ký, bạn đã đồng ý với Điều khoản & Chính sách bảo mật của Nhat Duy Market.
        </p>

        <button
          type="submit"
          disabled={busy}
          aria-busy={loading}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-white transition-colors hover:bg-primary-strong active:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <>
              <Spinner className="h-5 w-5 text-white" /> Đang tạo tài khoản…
            </>
          ) : (
            <>
              Tạo tài khoản <ArrowRightIcon className="h-5 w-5" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Đã có tài khoản?{' '}
        <Link href="/login" className="font-semibold text-primary transition-colors hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
