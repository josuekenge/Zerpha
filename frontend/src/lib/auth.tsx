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

    // Check if we're in an OAuth callback (Supabase appends #access_token=... after OAuth)
    const hasOAuthCallback = typeof window !== 'undefined' && (
      window.location.hash.includes('access_token') ||
      window.location.hash.includes('refresh_token') ||
      window.location.hash.includes('error')
    );

    // Set up the auth state change listener FIRST
    // This is crucial because onAuthStateChange will fire when Supabase processes the OAuth tokens
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;

      // Update session and user state
      setSession(newSession);
      setUser(newSession?.user ?? null);

      // For OAuth callbacks, we wait for the SIGNED_IN event before setting loading=false
      // For other cases (page refresh, etc.), we set loading=false on any auth change
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        setLoading(false);
      }
    });

    // Then check for existing session
    // If we're in an OAuth callback, Supabase will automatically process the tokens
    // and trigger onAuthStateChange, so we don't need to manually call getSession
    if (!hasOAuthCallback) {
      supabase.auth.getSession()
        .then(({ data: { session: initialSession } }) => {
          if (isMounted) {
            setSession(initialSession);
            setUser(initialSession?.user ?? null);
            setLoading(false);
          }
        })
        .catch((error) => {
          console.error('[Auth] Failed to get session:', error);
          if (isMounted) {
            setLoading(false);
          }
        });
    }

    // Timeout to ensure we never get stuck loading forever (important for OAuth errors)
    const timeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 5000); // 5 second timeout for OAuth callback processing

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
