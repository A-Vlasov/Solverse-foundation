import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  isAllowed: boolean;
  children: React.ReactNode;
  redirectPath?: string;
}

export default function ProtectedRoute({
  isAllowed,
  children,
  redirectPath = '/login'
}: ProtectedRouteProps) {
  if (!isAllowed) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
} 