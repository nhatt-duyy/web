import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const GridIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const BoxIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="m12 13 0 8" />
  </svg>
);
const ReceiptIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3l-2 1.5L15 3l-2 1.5L11 3 9 4.5 7 3 5 4.5Z" />
    <path d="M9 8h6M9 12h6" />
  </svg>
);
const StarIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 17l-5.3 2.1 1-5.8L3.5 9.2l5.9-.9L12 3Z" />
  </svg>
);
const TagIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" />
    <circle cx="8" cy="8" r="1.4" />
  </svg>
);
const TicketIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4V9Z" />
    <path d="M9 7v10" strokeDasharray="2 2" />
  </svg>
);
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" />
  </svg>
);

const NAV = [
  { to: '/dashboard', label: 'Tổng quan', icon: <GridIcon /> },
  { to: '/products', label: 'Sản phẩm', icon: <BoxIcon /> },
  { to: '/orders', label: 'Đơn hàng', icon: <ReceiptIcon /> },
  { to: '/reviews', label: 'Đánh giá', icon: <StarIcon /> },
  { to: '/coupons', label: 'Mã giảm giá', icon: <TagIcon /> },
  { to: '/tickets', label: 'Hỗ trợ', icon: <TicketIcon /> },
];

const Logo = () => (
  <span className="flex items-center gap-2.5 font-display text-lg font-bold">
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-strong text-sm font-bold text-white shadow-[0_8px_20px_-8px_var(--glow)] ring-1 ring-white/10">{'</>'}</span>
    <span>Source<span className="text-gradient">Ban</span></span>
  </span>
);

export const Layout = () => {
  const { user, logout } = useAuth();
  const initials = (user?.name ?? user?.email ?? 'A').slice(0, 1).toUpperCase();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-surface/60 backdrop-blur md:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-soft text-primary shadow-[inset_2px_0_0_0_var(--primary)]'
                    : 'text-muted hover:bg-surface-2 hover:text-foreground'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-4 text-xs text-muted-2">© 2026 SourceBan · Admin</div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface/70 px-5 backdrop-blur">
          <div className="md:hidden">
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold leading-none">{user?.name ?? 'Admin'}</p>
              <p className="mt-1 text-xs text-muted-2">{user?.email}</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
              {initials}
            </span>
            <button onClick={logout} className="chip">
              <LogoutIcon />
              Đăng xuất
            </button>
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-grid opacity-50" />
          <div className="relative mx-auto max-w-7xl animate-fade-in p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
