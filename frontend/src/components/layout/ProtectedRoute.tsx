import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';

interface ProtectedRouteProps {
  roles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles }) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white">Loading Enterprise BI Suite...</h2>
          <LoadingSkeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(roles)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-row">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Access Restricted" />
          <div className="p-12 text-center">
            <h2 className="text-2xl font-bold text-rose-400 mb-2">403 - Permission Denied</h2>
            <p className="text-slate-400 max-w-md mx-auto mb-6">
              Your role <span className="text-indigo-400 font-bold">({user.role})</span> does not have authorization to view this page. Contact an Administrator.
            </p>
            <a href="/dashboard" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium">Return to Dashboard</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-6 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
