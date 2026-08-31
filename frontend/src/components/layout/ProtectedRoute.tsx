import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, Role } from '@/stores/authStore';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children?: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export default ProtectedRoute;
