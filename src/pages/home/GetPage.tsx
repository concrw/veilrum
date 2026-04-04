// Get — 뿌리가 궁금하다
// 기능: V-File 기반 자기 구조 탐색 + Ikigai / 브랜드 정체성 / 멀티페르소나 (프리미엄)

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, veilrumDb } from '@/integrations/supabase/client';
import { ErrorState } from '@/components/ErrorState';
import { toast } from '@/hooks/use-toast';
import { usePremiumTrigger } from '@/hooks/usePremiumTrigger';
import UpgradeModal from '@/components/premium/UpgradeModal';
import WhyFlow from '@/components/why/WhyFlow';
import IdentityTab from '@/components/get/IdentityTab';
import IkigaiTab from '@/components/get/IkigaiTab';
import BrandTab from '@/components/get/BrandTab';

type Tab = 'identity' | 'why' | 'ikigai' | 'brand';

export default function GetPage() {
  const { user, primaryMask, axisScores } = useAuth();
  const qc = useQueryClient();
  const { isPro, modalOpen, activeTrigger, tryAccess, closeModal } = usePremiumTrigger();
  const [tab, setTab] = useState<Tab>('identity');

  // prime_perspectives 최신 레코드
  const { data: pp, isError: ppError, refetch: refetchPp } = useQuery({
    queryKey: ['prime-perspective', user?.id],
    queryFn: async () => {
      const { data } = await veilrumDb.from('prime_perspectives')
        .select('*').eq('user_id', user!.id)
        .order('created_at', { ascending: false }).limit(1).single();
      return data;
    },
    enabled: !!user,
  });

  // 누적 패턴 집계
  const { data: patternSummary } = useQuery({
    queryKey: ['pattern-summary', user?.id],
    queryFn: async () => {
      const { data } = await veilrumDb.rpc('get_user_pattern_summary', { p_user_id: user!.id });
      return data as {
        top_emotions: { emotion: string; cnt: number }[];
        top_domains: { domain: string; cnt: number }[];
        keywords: string[];
        vent_count: number; dig_count: number; set_count: number; signal_total: number;
      } | null;
    },
    enabled: !!user,
  });

  const ventCount = patternSummary?.vent_count ?? 0;
  const digCount = patternSummary?.dig_count ?? 0;
  const setCount = patternSummary?.set_count ?? 0;
  const totalSessions = ventCount + digCount + setCount;
  const topEmotions = (patternSummary?.top_emotions ?? []).slice(0, 3).map(e => [e.emotion, e.cnt] as [string, number]);
  const topDomain = (patternSummary?.top_domains ?? [])[0];
  const recentKeywords = (patternSummary?.keywords ?? []).slice(0, 5) as string[];

  // Ikigai state
  const [ikigaiEdit, setIkigaiEdit] = useState(false);
  const [ikigaiForm, setIkigaiForm] = useState({ love: '', good_at: '', world_needs: '', paid_for: '' });
  const [ikigaiAiLoading, setIkigaiAiLoading] = useState(false);
  const [ikigaiAiInsight, setIkigaiAiInsight] = useState('');

  const ikigaiSave = useMutation({
    mutationFn: async () => {
      const ikigai = {
        love: ikigaiForm.love.split('\n').filter(Boolean),
        good_at: ikigaiForm.good_at.split('\n').filter(Boolean),
        world_needs: ikigaiForm.world_needs.split('\n').filter(Boolean),
        paid_for: ikigaiForm.paid_for.split('\n').filter(Boolean),
        updated_at: new Date().toISOString(),
      };
      await veilrumDb.from('prime_perspectives').upsert({ user_id: user!.id, ikigai }, { onConflict: 'user_id' });
    },
    onSuccess: () => {
      toast({ title: 'Ikigai 저장 완료' });
      setIkigaiEdit(false);
      qc.invalidateQueries({ queryKey: ['prime-perspective', user?.id] });
    },
  });

  const handleIkigaiAiInsight = async () => {
    if (!ikigai) { toast({ title: 'Ikigai를 먼저 작성해 주세요.', variant: 'destructive' }); return; }
    setIkigaiAiLoading(true); setIkigaiAiInsight('');
    try {
      const { data, error } = await supabase.functions.invoke('generate-ikigai', { body: {} });
      if (error) throw error;
      if (data?.final_ikigai) setIkigaiAiInsight(data.final_ikigai);
      else if (data?.ikigai_intersections) setIkigaiAiInsight(`${data.ikigai_intersections.Passion?.join(', ') ?? ''} — 열정과 사명이 만나는 지점`);
      toast({ title: 'AI 인사이트 생성 완료' });
    } catch { toast({ title: 'AI 생성 실패', description: '잠시 후 다시 시도해 주세요.', variant: 'destructive' }); }
    finally { setIkigaiAiLoading(false); }
  };

  // Brand state
  const [brandEdit, setBrandEdit] = useState(false);
  const [brandForm, setBrandForm] = useState({ name: '', tagline: '', core_value: '', target: '', tone: '' });
  const [brandAiLoading, setBrandAiLoading] = useState(false);

  const brandSave = useMutation({
    mutationFn: async () => {
      const brand_identity = { ...brandForm, updated_at: new Date().toISOString() };
      await veilrumDb.from('prime_perspectives').upsert({ user_id: user!.id, brand_identity }, { onConflict: 'user_id' });
    },
    onSuccess: () => {
      toast({ title: '브랜드 정체성 저장 완료' });
      setBrandEdit(false);
      qc.invalidateQueries({ queryKey: ['prime-perspective', user?.id] });
    },
  });

  const handleBrandAiGenerate = async () => {
    setBrandAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-brand-strategy', {
        body: { ikigai: pp?.ikigai ?? null, whyAnalysis: pp?.perspective_text ? { prime_perspective: pp.perspective_text } : null, user: { email: user?.email } },
      });
      if (error) throw error;
      if (data?.brand_direction) {
        setBrandForm(prev => ({
          ...prev,
          tagline: data.brand_direction.positioning ?? prev.tagline,
          core_value: data.brand_direction.core_message ?? prev.core_value,
          target: data.target_audience?.age_range ?? prev.target,
          tone: data.brand_direction.field ?? prev.tone,
        }));
        setBrandEdit(true);
      }
      toast({ title: 'AI 브랜드 전략 생성 완료', description: '결과를 검토하고 저장하세요.' });
    } catch { toast({ title: 'AI 생성 실패', description: '잠시 후 다시 시도해 주세요.', variant: 'destructive' }); }
    finally { setBrandAiLoading(false); }
  };

  const ikigai = pp?.ikigai as Record<string, unknown> | null;
  const brand = pp?.brand_identity as Record<string, unknown> | null;

  const tabs: [Tab, string][] = [['identity', '정체성'], ['why', 'Why'], ['ikigai', 'Ikigai'], ['brand', '브랜드']];

  if (ppError) return <ErrorState title="Get 데이터를 불러오지 못했습니다" onRetry={() => refetchPp()} />;

  return (
    <div className="px-4 py-6 max-w-sm mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Get</h2>
        <p className="text-sm text-muted-foreground mt-1">나를 이루는 구조를 봐요.</p>
      </div>

      {/* 탭 */}
      <div className="bg-card border rounded-2xl p-1 flex">
        {tabs.map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors
              ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'identity' && (
        <IdentityTab
          primaryMask={primaryMask} axisScores={axisScores} pp={pp}
          isPro={isPro} tryAccess={tryAccess}
          totalSessions={totalSessions} ventCount={ventCount} digCount={digCount} setCount={setCount}
          topEmotions={topEmotions} topDomain={topDomain} recentKeywords={recentKeywords}
          signalTotal={patternSummary?.signal_total ?? 0}
        />
      )}

      {tab === 'why' && <WhyFlow />}

      {tab === 'ikigai' && (
        <IkigaiTab
          isPro={isPro} tryAccess={tryAccess} ikigai={ikigai}
          ikigaiEdit={ikigaiEdit} ikigaiForm={ikigaiForm}
          ikigaiAiLoading={ikigaiAiLoading} ikigaiAiInsight={ikigaiAiInsight}
          ikigaiSavePending={ikigaiSave.isPending}
          onSetIkigaiEdit={setIkigaiEdit} onSetIkigaiForm={setIkigaiForm}
          onIkigaiSave={() => ikigaiSave.mutate()} onIkigaiAiInsight={handleIkigaiAiInsight}
        />
      )}

      {tab === 'brand' && (
        <BrandTab
          isPro={isPro} tryAccess={tryAccess} brand={brand}
          brandEdit={brandEdit} brandForm={brandForm}
          brandAiLoading={brandAiLoading} brandSavePending={brandSave.isPending}
          onSetBrandEdit={setBrandEdit} onSetBrandForm={setBrandForm}
          onBrandSave={() => brandSave.mutate()} onBrandAiGenerate={handleBrandAiGenerate}
        />
      )}

      <UpgradeModal open={modalOpen} onClose={closeModal} trigger={activeTrigger} />
    </div>
  );
}
