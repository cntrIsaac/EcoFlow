import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase, mensajeError, supabase } from '../lib/supabase';
type AuthValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthValue | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let mounted = true;
    let authEventReceived = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      authEventReceived = true;
      if (mounted) {
        setSession(next);
        setLoading(false);
        setError(null);
      }
    });
    void supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!mounted || authEventReceived) return;
        setSession(data.session);
        setError(sessionError?.message ?? null);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (mounted) {
          setError(mensajeError(cause));
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);
  async function signIn(email: string, password: string) {
    const { error: signInError } = await getSupabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) throw new Error(signInError.message);
  }
  async function signOut() {
    const { error: signOutError } = await getSupabase().auth.signOut();
    if (signOutError) throw new Error(signOutError.message);
    setSession(null);
  }
  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        error,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth requiere AuthProvider.');
  return context;
}
