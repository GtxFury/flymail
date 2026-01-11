import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import Layout from '@/components/layout';
import LoginPage from '@/pages/login';
import RegisterPage from '@/pages/register';
import DashboardPage from '@/pages/dashboard';
import DomainsPage from '@/pages/domains';
import InboxPage from '@/pages/inbox';
import SettingsPage from '@/pages/settings';
import AdminPage from '@/pages/admin';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  return user?.isAdmin ? <>{children}</> : <Navigate to="/" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <Navigate to="/" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="flymail-theme">
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="domains" element={<DomainsPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="inbox/:addressId" element={<InboxPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route
            path="admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
      <Toaster />
    </ThemeProvider>
  );
}
