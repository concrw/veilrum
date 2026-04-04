import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthError, Session, User } from "@supabase/supabase-js";
import { supabase, veilrumDb } from "@/integrations/supabase/client";
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
  authError: string | null;
  // 온보딩
  onboardingStep: OnboardingStep;
  priperCompleted: boolean;
  primaryMask: string | null;
  secondaryMask: string | null;
  axisScores: AxisScores | null;
  personaContextsCompleted: string[];
  setOnboardingStep: (step: OnboardingStep) => Promise<void>;
  completePriper: (primary: string, secondary: string, scores: AxisScores, mskCode?: string) => Promise<void>;
  // Auth
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, nickname?: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
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
  const [authError, setAuthError] = useState<string | null>(null);
  const [personaContextsCompleted, setPersonaContextsCompleted] = useState<string[]>([]);

  const syncOnboarding = async (userId: string) => {
    const { data, error } = await veilrumDb
      .from('user_profiles')
      .select('onboarding_step, priper_completed, primary_mask, secondary_mask, axis_scores, persona_contexts_completed')
      .eq('user_id', userId)
      .single();

    if (error) {
      // PGRST116 = "no rows returned" — 신규 유저, 정상 케이스
      if (error.code !== 'PGRST116') {
        console.error('[AuthContext] syncOnboarding failed:', error.message);
        setAuthError(`프로필 동기화 실패: ${error.message}`);
      }
      return;
    }

    if (data) {
      setOnboardingStepState((data.onboarding_step as OnboardingStep) ?? 'welcome');
      setPriperCompleted(data.priper_completed ?? false);
      setPrimaryMask(data.primary_mask ?? null);
      setSecondaryMask(data.secondary_mask ?? null);
      setAxisScores(data.axis_scores ?? null);
      setPersonaContextsCompleted(data.persona_contexts_completed ?? []);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sess) => {
      // VS-06-1: TOKEN_REFRESH_FAILED / 강제 로그아웃 이벤트 처리
      if (event === 'TOKEN_REFRESHED' && !sess) {
        console.warn('Token refresh returned no session — signing out');
        await supabase.auth.signOut();
        toast({ title: '세션 만료', description: '다시 로그인해 주세요.', variant: 'destructive' });
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_OUT' || (!sess && event !== 'INITIAL_SESSION')) {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

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
    await veilrumDb.from('user_profiles').upsert({
      user_id: user.id, onboarding_step: step, updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  };

  const completePriper = async (primary: string, secondary: string, scores: AxisScores, mskCode?: string) => {
    setPriperCompleted(true);
    setPrimaryMask(primary);
    setSecondaryMask(secondary);
    setAxisScores(scores);
    setOnboardingStepState('completed');
    if (!user) return;
    await veilrumDb.from('user_profiles').upsert({
      user_id: user.id,
      onboarding_step: 'completed',
      priper_completed: true,
      primary_mask: primary,
      secondary_mask: secondary,
      axis_scores: scores,
      msk_code: mskCode ?? null,
      data_source: 'priper',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    // 커뮤니티 자동 배치 — V-File 기반
    // AVD(회피형) → 회피형 그룹 / APV·DEP(불안형) → 불안형 그룹 / 기본 → 소통 그룹
    const MASK_COMMUNITY_MAP: Record<string, string> = {
      AVD: '614dd0d9-ae3d-4622-bc81-08138ca7341c', // 회피형 애착 극복 모임
      APV: '4865c84c-9772-4f69-9acf-5f9a02ac4fed', // 불안형 애착 — 집착과 거리두기
      DEP: '4865c84c-9772-4f69-9acf-5f9a02ac4fed', // 불안형 동일
    };
    const DEFAULT_GROUP_ID = '651bca71-b44c-425d-ba05-db0e48e21fe2'; // 소통 & 갈등 해결
    const groupId = MASK_COMMUNITY_MAP[mskCode ?? ''] ?? DEFAULT_GROUP_ID;
    // 이미 가입된 경우 무시 (upsert 대신 insert + onConflict ignore)
    await veilrumDb.from('community_memberships').upsert({
      user_id: user.id,
      group_id: groupId,
      role: 'member',
      joined_at: new Date().toISOString(),
    }, { onConflict: 'user_id,group_id', ignoreDuplicates: true });
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
      await veilrumDb.from('user_profiles').upsert({
        user_id: data.user.id,
        nickname: nickname ?? email.split('@')[0],
        onboarding_step: 'welcome',
        priper_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      toast({ title: '회원가입 완료', description: '이메일을 확인해 주세요.' });
    }
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
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
    setPersonaContextsCompleted([]);
    toast({ title: '로그아웃', description: '다음에 또 만나요!' });
  };

  const value = useMemo<AuthContextValue>(() => ({
    user, session, loading, authError,
    onboardingStep, priperCompleted, primaryMask, secondaryMask, axisScores, personaContextsCompleted,
    setOnboardingStep, completePriper,
    signIn, signUp, signInWithGoogle, signOut,
  }), [user, session, loading, authError, onboardingStep, priperCompleted, primaryMask, secondaryMask, axisScores, personaContextsCompleted]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
