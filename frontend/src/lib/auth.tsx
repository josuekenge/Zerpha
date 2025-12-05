import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Prevent duplicate initialization
    if (initialized) return;

    let isMounted = true;

    // Set up auth state listener FIRST before checking session
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log('[Auth] State change:', event);

      if (!isMounted) return;

      // Update state based on event
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      // Only set loading to false after we've processed the initial session
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setLoading(false);
      }
    });

    // Mark as initialized
    setInitialized(true);

    // Also do an explicit session check as fallback
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[Auth] Session check error:', error);
        }
        if (!isMounted) return;

        // If onAuthStateChange hasn't fired yet, use this session
        if (loading && data.session) {
          setSession(data.session);
          setUser(data.session.user);
          setLoading(false);
        } else if (loading && !data.session) {
          // No session exists
          setLoading(false);
        }
      } catch (err) {
        console.error('[Auth] Session check failed:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Small delay to let onAuthStateChange fire first
    const timer = setTimeout(checkSession, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [initialized, loading]);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
    }),
    [user, session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/workspace`,
    },
  });
  if (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

export async function signInWithEmail(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/workspace`,
    },
  });
  if (error) {
    console.error('Email sign-in error:', error);
    throw error;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}


