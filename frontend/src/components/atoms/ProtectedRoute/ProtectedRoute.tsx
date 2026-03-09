import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import type { AppRole } from '/home/vaishnavgpal/Code/projects/library-management-system/frontend/src/utils/types.ts';

interface Props {
  /** If supplied, only this role may access the route. */
  role?: AppRole;
  children: React.ReactNode;
}

/**
 * Wraps a route so unauthenticated users are sent to /login and
 * users with the wrong role are sent to their correct dashboard.
 */
export const ProtectedRoute: React.FC<Props> = ({ role, children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user?.role !== role) {
    // Send them to their actual dashboard instead of showing a blank screen
    const fallback = user?.role === 'admin' ? '/admin/dashboard' : '/member/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};
