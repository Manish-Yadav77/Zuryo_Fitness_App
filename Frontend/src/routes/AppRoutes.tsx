import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute } from '@/components/auth/GuestRoute';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { roleHome } from '@/config/nav';
import { useAuth } from '@/hooks/useAuth';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import CustomerDashboard from '@/pages/customer/CustomerDashboard';
import TrainerDashboard from '@/pages/trainer/TrainerDashboard';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import PricingPage from '@/pages/admin/PricingPage';
import NotFoundPage from '@/pages/NotFoundPage';

function RoleRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? roleHome[user.role] : '/login'} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<RoleRedirect />} />

          <Route element={<ProtectedRoute roles={['customer']} />}>
            <Route path="/customer" element={<CustomerDashboard />} />
          </Route>

          <Route element={<ProtectedRoute roles={['trainer']} />}>
            <Route path="/trainer" element={<TrainerDashboard />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/pricing" element={<PricingPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}