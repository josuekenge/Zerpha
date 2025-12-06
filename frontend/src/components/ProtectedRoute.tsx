import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface ProtectedRouteProps {
  children: JSX.Element;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Check if URL contains OAuth callback tokens (Supabase appends #access_token=... after OAuth)
  // If so, we should wait for the session to be established before deciding to redirect
  const hasAuthCallback = typeof window !== 'undefined' && (
    window.location.hash.includes('access_token') ||
    window.location.hash.includes('refresh_token') ||
    window.location.hash.includes('error_description')
  );

  // Show loading if either:
  // 1. Auth is still loading
  // 2. We have an auth callback in the URL (session is being established)
  if (loading || (hasAuthCallback && !user)) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-sm text-slate-600">
            {hasAuthCallback ? 'Completing sign in...' : 'Checking your session...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return children;
}




