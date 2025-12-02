import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>; 
  signUp: (email: string, password: string) => Promise<{ error: any }>; 
  signInWithGoogle: () => Promise<{ error: any }>; 
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const linkingRef = useRef(false);

  // Admin status check based on email
  const checkAdminStatus = async (user: User) => {
    try {
      // Check if user email is the admin email
      const isAdminEmail = user.email === 'concrecrw@gmail.com';
      setIsAdmin(isAdminEmail);
      
      if (isAdminEmail) {
        console.log('Admin user detected:', user.email);
      }
    } catch (error) {
      // Silently fail and continue without admin privileges
      console.log('Admin status check failed, continuing as normal user');
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // 1) Listen first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);

      // Only check admin status if user exists, but don't block on it
      if (sess?.user) {
        checkAdminStatus(sess.user).catch(() => {
          // Silent fail
          setIsAdmin(false);
        });
      } else {
        setIsAdmin(false);
      }

      if (event === 'SIGNED_IN' && sess?.user && !linkingRef.current) {
        linkingRef.current = true;
        // Link anonymous data from last session id
        setTimeout(async () => {
          try {
            const lastSessionId = localStorage.getItem('priper:last_session_id');
            if (!lastSessionId) return;
            const uid = sess.user.id;
            // Attach brainstorm session
            await (supabase as any)
              .from('brainstorm_sessions')
              .update({ user_id: uid })
              .eq('id', lastSessionId)
              .is('user_id', null);
            // Attach related job entries
            await (supabase as any)
              .from('job_entries')
              .update({ user_id: uid })
              .eq('session_id', lastSessionId)
              .is('user_id', null);
          } catch (e) {
            console.error('Anonymous data link failed', e);
          } finally {
            linkingRef.current = false;
          }
        }, 0);
      }
    });

    // 2) Then fetch existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check admin status if user exists, but don't block loading
      if (session?.user) {
        checkAdminStatus(session.user).catch(() => {
          setIsAdmin(false);
        });
      }
      
      // Always complete loading regardless of admin check
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast({ title: '로그인 실패', description: error.message, variant: 'destructive' });
    else toast({ title: '로그인 성공', description: '환영합니다!' });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl }
    });
    if (error) toast({ title: '회원가입 실패', description: error.message, variant: 'destructive' });
    else toast({ title: '회원가입 완료', description: '이메일을 확인해 로그인해주세요.' });
    return { error };
  };

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectUrl } as any });
    if (error) toast({ title: 'Google 로그인 실패', description: error.message, variant: 'destructive' });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    toast({ title: '로그아웃', description: '다음에 또 만나요!' });
  };

  const value = useMemo<AuthContextValue>(() => ({ 
    user, 
    session, 
    loading, 
    isAdmin,
    signIn, 
    signUp, 
    signInWithGoogle, 
    signOut 
  }), [user, session, loading, isAdmin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};