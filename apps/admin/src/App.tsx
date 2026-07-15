import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Reviews from './pages/Reviews';
import Coupons from './pages/Coupons';
import Tickets from './pages/Tickets';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout>
              <Outlet />
            </Layout>
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/coupons" element={<Coupons />} />
        <Route path="/tickets" element={<Tickets />} />
      </Route>
    </Routes>
  );
}

export default App;
