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
  { title: 'Quản lý sản phẩm', desc: 'Thêm, sửa, ẩn/hiện source code & gói bán.' },
  { title: 'Vận hành đơn hàng', desc: 'Cập nhật trạng thái thanh toán, xử lý ticket.' },
  { title: 'Dự án custom & CMS', desc: 'Kanban tiến độ, kiểm duyệt bài viết & đánh giá.' },
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

  const hasError = Boolean(error);

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel — không blur orb, dùng lưới mảnh + typography làm điểm nhấn */}
      <aside className="relative hidden overflow-hidden border-r border-border bg-surface lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />

        <div className="relative">
          <span className="flex items-center gap-2.5 font-display text-lg font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-border-strong bg-surface-2 font-mono text-xs font-bold text-primary">{'</>'}</span>
            <span>Source<span className="text-primary-strong">Ban</span></span>
          </span>
        </div>

        <div className="relative max-w-md">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-2">Admin console</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.1] tracking-tight">
            Vận hành marketplace source code
          </h1>
          <p className="mt-4 text-muted">
            Sản phẩm, đơn hàng, khách hàng và báo cáo — quản trị tập trung trong một giao diện.
          </p>
          <ul className="mt-8 divide-y divide-border border-y border-border">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-baseline gap-3 py-3">
                <span className="font-mono text-xs text-primary">—</span>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-sm text-muted-2">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-muted-2">© 2026 SourceBan · Admin Console</p>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <span className="mb-8 flex items-center justify-center gap-2.5 font-display text-lg font-bold text-foreground lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-border-strong bg-surface-2 font-mono text-xs font-bold text-primary">{'</>'}</span>
            <span>Source<span className="text-primary-strong">Ban</span></span>
          </span>

          <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)] sm:p-7">
            <h1 className="font-display text-2xl font-bold tracking-tight">Đăng nhập</h1>
            <p className="mt-2 text-sm text-muted">Tài khoản quản trị SourceBan.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              {error && (
                <div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
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
                    aria-invalid={hasError}
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
                    aria-invalid={hasError}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Đang đăng nhập…
                  </>
                ) : (
                  <>Đăng nhập <ArrowRightIcon /></>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-2">
              Tài khoản được cấp bởi quản trị viên hệ thống.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
