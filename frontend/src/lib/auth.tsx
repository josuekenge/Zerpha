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

  useEffect(() => {
    let isMounted = true;
    let didSetLoading = false;

    // Timeout to ensure we never get stuck loading forever
    const timeout = setTimeout(() => {
      if (isMounted && !didSetLoading) {
        console.warn('[Auth] Session check timed out, setting loading to false');
        didSetLoading = true;
        setLoading(false);
      }
    }, 3000); // 3 second timeout

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session: initialSession } }) => {
        if (isMounted && !didSetLoading) {
          didSetLoading = true;
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('[Auth] Failed to get session:', error);
        if (isMounted && !didSetLoading) {
          didSetLoading = true;
          setLoading(false);
        }
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (isMounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        // Also set loading false here in case getSession hasn't returned yet
        if (!didSetLoading) {
          didSetLoading = true;
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

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
