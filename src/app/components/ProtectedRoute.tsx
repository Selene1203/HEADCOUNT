import { Navigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from './Layout';

export function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    if (user.role === 'lecturer') return <Navigate to="/lecturer-dashboard" replace />;
    return <Navigate to="/student-dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
}