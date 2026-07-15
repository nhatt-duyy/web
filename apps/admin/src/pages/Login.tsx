import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const MailIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
  </svg>
);
const LockIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
  </svg>
);

const FEATURES = [
  { title: 'Quản lý sản phẩm', desc: 'Thêm, sửa, ẩn/hiện source code.' },
  { title: 'Vận hành đơn hàng', desc: 'Cập nhật trạng thái thanh toán.' },
  { title: 'Báo cáo thời gian thực', desc: 'Doanh thu & tăng trưởng.' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-[#07080c] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative">
          <span className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-strong text-sm font-bold text-white shadow-[0_8px_20px_-8px_var(--glow)] ring-1 ring-white/10">{'</>'}</span>
            <span>Source<span className="text-gradient">Ban</span></span>
          </span>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white">
            Trung tâm <span className="text-gradient">quản trị</span>
          </h1>
          <p className="mt-4 text-muted-2">
            Vận hành marketplace source code: sản phẩm, đơn hàng và báo cáo — trong một giao diện duy nhất.
          </p>
          <ul className="mt-8 space-y-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-primary ring-1 ring-white/10">{f.title[0]}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-muted-2">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-muted-2">© 2026 SourceBan · Admin Console</p>
      </aside>

      {/* Form panel */}
      <main className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <span className="mb-8 flex items-center justify-center gap-2.5 font-display text-lg font-bold text-foreground lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-strong text-sm font-bold text-white shadow-[0_8px_20px_-8px_var(--glow)] ring-1 ring-white/10">{'</>'}</span>
            <span>Source<span className="text-gradient">Ban</span></span>
          </span>

          <div className="rounded-2xl border border-border bg-surface/70 p-7 shadow-[var(--shadow-card)] backdrop-blur sm:p-8">
            <h1 className="font-display text-2xl font-bold tracking-tight">Đăng nhập Admin</h1>
            <p className="mt-2 text-sm text-muted">Quản trị SourceBan — sản phẩm, đơn hàng &amp; báo cáo.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              {error && (
                <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-2"><MailIcon /></span>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder="admin@sourceban.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium">Mật khẩu</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-2"><LockIcon /></span>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Đang đăng nhập...' : (<>Đăng nhập <ArrowRightIcon /></>)}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              Tài khoản được cấp bởi administrator.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
