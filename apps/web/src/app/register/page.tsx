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
  const [loading, setLoading] = useState(false);

  const setField = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
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

  const handleOAuth = (provider: 'google' | 'github') => signIn(provider, { callbackUrl });

  return (
    <div className="rounded-2xl border border-border bg-surface/70 p-7 shadow-[var(--shadow-card)] backdrop-blur sm:p-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Tạo tài khoản</h1>
      <p className="mt-2 text-sm text-muted">Tham gia Nhat Duy Market để tải source code và theo dõi đơn hàng.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary-soft"
        >
          <GoogleIcon className="h-5 w-5" /> Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuth('github')}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary-soft"
        >
          <GithubIcon className="h-5 w-5" /> GitHub
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
              className="pl-10"
              aria-describedby={error ? 'register-error' : undefined}
            />
          </div>
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
              className="pl-10"
            />
          </div>
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
                className="pl-10"
              />
            </div>
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
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <p className="flex items-start gap-2 text-xs text-muted">
          <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Bằng việc đăng ký, bạn đã đồng ý với Điều khoản & Chính sách bảo mật của Nhat Duy Market.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-white shadow-[0_12px_30px_-12px_var(--glow)] transition-all hover:-translate-y-px hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {loading ? (
            <Spinner className="h-5 w-5" />
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
