// Phân quyền tập trung (RBAC) cho Admin Panel — Phase 3 Mục 4.
// Giá trị Role phải khớp với enum Role trong Prisma (CUSTOMER | STAFF | ADMIN).

export type Role = 'CUSTOMER' | 'STAFF' | 'ADMIN';

// Quyền truy cập từng route admin. ADMIN luôn đầy đủ;
// STAFF chỉ được xem tổng quan, đơn hàng và hỗ trợ (theo quyết định đã chốt).
export const ROLE_ACCESS: Record<string, Role[]> = {
  '/dashboard': ['ADMIN', 'STAFF'],
  '/products': ['ADMIN'],
  '/orders': ['ADMIN', 'STAFF'],
  '/reviews': ['ADMIN'],
  '/coupons': ['ADMIN'],
  '/tickets': ['ADMIN', 'STAFF'],
  // Mục 3 / Mục 5 sẽ tạo trang, nhưng quyền đã chốt ở đây:
  '/users': ['ADMIN'],
  '/posts': ['ADMIN'],
};

// Kiểm tra user có vai trò được phép truy cập route không.
export const canAccess = (path: string, role?: Role): boolean => {
  const allowed = ROLE_ACCESS[path];
  if (!allowed) return true;
  return !!role && allowed.includes(role);
};
