import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

type Props = {
  children: React.ReactNode;
  requiredRole?: string[];
};

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-xl">ت</span>
          </div>
          <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Once profile is loaded, enforce staff-only access.
  // While profile is still null (loading), we already show the spinner above via `loading`.
  // If profile loaded but role is customer (or any non-staff role), redirect to home.
  const STAFF_ROLES = ['super_admin', 'admin', 'manager', 'accountant', 'employee'];
  if (!loading && profile && !STAFF_ROLES.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && profile && !requiredRole.includes(profile.role)) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
