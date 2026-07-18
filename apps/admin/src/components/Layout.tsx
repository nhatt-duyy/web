import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { canAccess } from '../lib/rbac';

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
const DocIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
    <path d="M14 4v5h5" /><path d="M8 13h8M8 17h6" />
  </svg>
);
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const ProjectIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18M9 4v16M15 4v16" />
  </svg>
);
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" />
  </svg>
);
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

const NAV = [
  { to: '/dashboard', label: 'Tổng quan', icon: <GridIcon /> },
  { to: '/products', label: 'Sản phẩm', icon: <BoxIcon /> },
  { to: '/orders', label: 'Đơn hàng', icon: <ReceiptIcon /> },
  { to: '/reviews', label: 'Đánh giá', icon: <StarIcon /> },
  { to: '/coupons', label: 'Mã giảm giá', icon: <TagIcon /> },
  { to: '/posts', label: 'Bài viết', icon: <DocIcon /> },
  { to: '/tickets', label: 'Hỗ trợ', icon: <TicketIcon /> },
  { to: '/custom-projects', label: 'Dự án Custom', icon: <ProjectIcon /> },
  { to: '/users', label: 'Khách hàng', icon: <UsersIcon /> },
];

const Logo = () => (
  <span className="flex items-center gap-2.5 font-display text-lg font-bold">
    <span className="grid h-8 w-8 place-items-center rounded-lg border border-border-strong bg-surface-2 font-mono text-xs font-bold text-primary">{'</>'}</span>
    <span>Source<span className="text-primary-strong">Ban</span></span>
  </span>
);

// Danh sách link điều hướng dùng chung cho sidebar desktop + drawer mobile.
const NavList = ({ role, onNavigate }: { role?: 'CUSTOMER' | 'STAFF' | 'ADMIN'; onNavigate?: () => void }) => (
  <nav className="flex-1 space-y-0.5 p-3">
    {NAV.filter((item) => canAccess(item.to, role)).map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={onNavigate}
        className={({ isActive }) =>
          `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive
              ? 'bg-primary-soft text-primary'
              : 'text-muted hover:bg-surface-2 hover:text-foreground'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span
              aria-hidden
              className={`h-5 w-0.5 shrink-0 rounded-full transition-colors ${
                isActive ? 'bg-primary' : 'bg-transparent'
              }`}
            />
            {item.icon}
            {item.label}
          </>
        )}
      </NavLink>
    ))}
  </nav>
);

export const Layout = () => {
  const { user, logout } = useAuth();
  const role = user?.role as 'CUSTOMER' | 'STAFF' | 'ADMIN' | undefined;
  const initials = (user?.name ?? user?.email ?? 'A').slice(0, 1).toUpperCase();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Đóng drawer mỗi khi đổi route (mobile).
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar desktop */}
      <aside className="hidden w-60 flex-col border-r border-border bg-surface md:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo />
        </div>
        <NavList role={role} />
        <div className="border-t border-border p-4 text-xs text-muted-2">© 2026 SourceBan · Admin</div>
      </aside>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-border bg-surface">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <Logo />
              <button onClick={() => setMobileOpen(false)} className="chip !px-2" aria-label="Đóng menu">
                <CloseIcon />
              </button>
            </div>
            <NavList role={role} onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-border p-4 text-xs text-muted-2">© 2026 SourceBan · Admin</div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface/85 px-4 backdrop-blur sm:px-5">
          <div className="flex items-center gap-3 md:hidden">
            <button onClick={() => setMobileOpen(true)} className="chip !px-2" aria-label="Mở menu">
              <MenuIcon />
            </button>
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-none">{user?.name ?? 'Admin'}</p>
              <p className="mt-1 text-xs text-muted-2">{user?.email}</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full border border-border-strong bg-surface-2 text-sm font-bold text-primary">
              {initials}
            </span>
            <button onClick={logout} className="chip">
              <LogoutIcon />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl animate-fade-in p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
