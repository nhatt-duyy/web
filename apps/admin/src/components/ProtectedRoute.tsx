import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Role } from '../lib/rbac';

// Trang báo không đủ quyền (RBAC) — Phase 3 Mục 4.
const Forbidden = () => (
  <div className="grid min-h-[60vh] place-items-center">
    <div className="card max-w-md text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-danger-soft text-danger">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      </div>
      <h1 className="font-display text-xl font-bold">Không có quyền truy cập</h1>
      <p className="mt-2 text-sm text-muted">
        Tài khoản của bạn không thuộc vai trò được phép truy cập trang này. Vui lòng liên hệ quản trị viên nếu cần.
      </p>
      <a href="/dashboard" className="btn-primary mt-5">Về tổng quan</a>
    </div>
  </div>
);

export const ProtectedRoute = ({
  children,
  allowedRoles = ['ADMIN'],
}: {
  children: React.ReactNode;
  allowedRoles?: Role[];
}) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // RBAC: chặn nếu vai trò không nằm trong danh sách được phép.
  if (user && !allowedRoles.includes(user.role as Role)) {
    return <Forbidden />;
  }

  return children;
};
