import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Role } from './lib/rbac';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Reviews from './pages/Reviews';
import Coupons from './pages/Coupons';
import Tickets from './pages/Tickets';
import Users from './pages/Users';
import Posts from './pages/Posts';
import CustomProjects from './pages/CustomProjects';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'STAFF'] as Role[]}>
            <Layout>
              <Outlet />
            </Layout>
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF'] as Role[]}><Dashboard /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute allowedRoles={['ADMIN'] as Role[]}><Products /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF'] as Role[]}><Orders /></ProtectedRoute>} />
        <Route path="/reviews" element={<ProtectedRoute allowedRoles={['ADMIN'] as Role[]}><Reviews /></ProtectedRoute>} />
        <Route path="/coupons" element={<ProtectedRoute allowedRoles={['ADMIN'] as Role[]}><Coupons /></ProtectedRoute>} />
        <Route path="/tickets" element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF'] as Role[]}><Tickets /></ProtectedRoute>} />
        <Route path="/custom-projects" element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF'] as Role[]}><CustomProjects /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute allowedRoles={['ADMIN'] as Role[]}><Users /></ProtectedRoute>} />
        <Route path="/posts" element={<ProtectedRoute allowedRoles={['ADMIN'] as Role[]}><Posts /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

export default App;
