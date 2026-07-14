import { Outlet } from 'react-router-dom';

export const Layout = () => {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border">
        <div className="p-4">
          <h2 className="text-xl font-bold text-foreground">Admin Panel</h2>
          <nav className="mt-6 space-y-2">
            <a
              href="/dashboard"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-accent/50 transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/products"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-accent/50 transition-colors"
            >
              Sản phẩm
            </a>
            <a
              href="/orders"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-accent/50 transition-colors"
            >
              Đơn hàng
            </a>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};
