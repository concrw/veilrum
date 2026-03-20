import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type OnboardingStep = 'welcome' | 'cq' | 'priper' | 'completed';

export interface AxisScores {
  A: number; // 애착: 0=회피, 100=불안
  B: number; // 소통: 0=폐쇄, 100=개방
  C: number; // 욕구표현: 0=억압, 100=표현
  D: number; // 역할: 0=수용, 100=주도
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  // 온보딩
  onboardingStep: OnboardingStep;
  priperCompleted: boolean;
  primaryMask: string | null;
  secondaryMask: string | null;
  axisScores: AxisScores | null;
  setOnboardingStep: (step: OnboardingStep) => Promise<void>;
  completePriper: (primary: string, secondary: string, scores: AxisScores) => Promise<void>;
  // Auth
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, nickname?: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingStep, setOnboardingStepState] = useState<OnboardingStep>('welcome');
  const [priperCompleted, setPriperCompleted] = useState(false);
  const [primaryMask, setPrimaryMask] = useState<string | null>(null);
  const [secondaryMask, setSecondaryMask] = useState<string | null>(null);
  const [axisScores, setAxisScores] = useState<AxisScores | null>(null);

  const syncOnboarding = async (userId: string) => {
    try {
      const { data } = await (supabase as any)
        .schema('veilrum')
        .from('user_profiles')
        .select('onboarding_step, priper_completed, primary_mask, secondary_mask, axis_scores')
        .eq('id', userId)
        .single();
      if (data) {
        setOnboardingStepState((data.onboarding_step as OnboardingStep) ?? 'welcome');
        setPriperCompleted(data.priper_completed ?? false);
        setPrimaryMask(data.primary_mask ?? null);
        setSecondaryMask(data.secondary_mask ?? null);
        setAxisScores(data.axis_scores ?? null);
      }
    } catch {
      // 프로필 없으면 welcome 유지
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) await syncOnboarding(sess.user.id);
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) await syncOnboarding(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const setOnboardingStep = async (step: OnboardingStep) => {
    setOnboardingStepState(step);
    if (!user) return;
    await (supabase as any).schema('veilrum').from('user_profiles').upsert({
      id: user.id, onboarding_step: step, updated_at: new Date().toISOString(),
    });
  };

  const completePriper = async (primary: string, secondary: string, scores: AxisScores) => {
    setPriperCompleted(true);
    setPrimaryMask(primary);
    setSecondaryMask(secondary);
    setAxisScores(scores);
    setOnboardingStepState('completed');
    if (!user) return;
    await (supabase as any).schema('veilrum').from('user_profiles').upsert({
      id: user.id,
      onboarding_step: 'completed',
      priper_completed: true,
      primary_mask: primary,
      secondary_mask: secondary,
      axis_scores: scores,
      updated_at: new Date().toISOString(),
    });
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast({ title: '로그인 실패', description: error.message, variant: 'destructive' });
    return { error };
  };

  const signUp = async (email: string, password: string, nickname?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) {
      toast({ title: '회원가입 실패', description: error.message, variant: 'destructive' });
    } else if (data.user) {
      await (supabase as any).schema('veilrum').from('user_profiles').upsert({
        id: data.user.id,
        nickname: nickname ?? email.split('@')[0],
        onboarding_step: 'welcome',
        priper_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      toast({ title: '회원가입 완료', description: '이메일을 확인해 주세요.' });
    }
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` } as any,
    });
    if (error) toast({ title: 'Google 로그인 실패', description: error.message, variant: 'destructive' });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setOnboardingStepState('welcome');
    setPriperCompleted(false);
    setPrimaryMask(null);
    setSecondaryMask(null);
    setAxisScores(null);
    toast({ title: '로그아웃', description: '다음에 또 만나요!' });
  };

  const value = useMemo<AuthContextValue>(() => ({
    user, session, loading,
    onboardingStep, priperCompleted, primaryMask, secondaryMask, axisScores,
    setOnboardingStep, completePriper,
    signIn, signUp, signInWithGoogle, signOut,
  }), [user, session, loading, onboardingStep, priperCompleted, primaryMask, secondaryMask, axisScores]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
