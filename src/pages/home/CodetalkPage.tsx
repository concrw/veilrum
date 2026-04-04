import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { veilrumDb } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { getVirtualCodetalkEntries } from '@/lib/virtualCodetalk';
import { KeywordCard } from '@/components/codetalk/KeywordCard';
import { StoryFeed } from '@/components/codetalk/StoryFeed';

function isPublicFeedOpen(): boolean {
  return new Date().getHours() >= 6;
}

function getStreakMessage(streak: number): string | null {
  if (streak >= 30) return `${streak}일 연속! 당신만의 언어 사전이 만들어지고 있어요.`;
  if (streak >= 14) return `${streak}일 연속 기록 중! 패턴이 선명해지고 있어요.`;
  if (streak >= 7) return `${streak}일 연속 기록 중! 당신의 언어가 쌓이고 있어요.`;
  if (streak >= 3) return `${streak}일째 이어가고 있어요. 패턴이 보이기 시작해요.`;
  if (streak === 1) return '오늘 다시 시작했어요. 한 걸음씩.';
  return null;
}

const STEPS = [
  { key: 'definition',        label: '정의',   prompt: '이 키워드를 당신만의 언어로 정의한다면?' },
  { key: 'imprinting_moment', label: '각인',   prompt: '이 키워드가 처음 각인된 기억이나 순간은?' },
  { key: 'root_cause',        label: '원인',   prompt: '왜 이것이 지금의 관계에서 반복되는 것 같나요?' },
] as const;

type StepKey = typeof STEPS[number]['key'];

export default function CodetalkPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<StepKey, string>>>({});
  const [isPublic, setIsPublic] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['codetalk-profile', user?.id],
    queryFn: async () => {
      const { data } = await veilrumDb.from('user_profiles')
        .select('codetalk_day, streak_count').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const currentDay = profile?.codetalk_day ?? 1;
  const streakCount = profile?.streak_count ?? 0;
  const streakMessage = getStreakMessage(streakCount);

  const { data: keyword, isLoading } = useQuery({
    queryKey: ['codetalk-today', user?.id, currentDay],
    queryFn: async () => {
      const { data } = await veilrumDb.from('codetalk_keywords')
        .select('*').eq('day_number', currentDay).single();
      return data;
    },
    enabled: !!user && currentDay > 0,
  });

  const { data: todayEntry } = useQuery({
    queryKey: ['codetalk-entry-today', user?.id, keyword?.id],
    queryFn: async () => {
      const { data } = await veilrumDb.from('codetalk_entries')
        .select('*').eq('user_id', user!.id).eq('keyword_id', keyword.id)
        .order('created_at', { ascending: false }).limit(1).single();
      return data;
    },
    enabled: !!user && !!keyword,
  });

  const { data: pastEntries } = useQuery({
    queryKey: ['codetalk-history', user?.id],
    queryFn: async () => {
      const { data } = await veilrumDb.from('codetalk_entries')
        .select('*, codetalk_keywords(keyword, day_number)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false }).limit(10);
      return data ?? [];
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      let alias: string | null = null;
      const { data: existing } = await veilrumDb.from('anon_author_map')
        .select('anon_alias').eq('real_user_id', user!.id).eq('context', 'codetalk').maybeSingle();
      if (existing) {
        alias = existing.anon_alias;
      } else if (isPublic) {
        const adjectives = ['조용한', '따뜻한', '솔직한', '깊은', '유연한'];
        const nouns = ['달', '별', '숲', '강', '빛'];
        alias = adjectives[Math.floor(Math.random() * adjectives.length)] + ' ' + nouns[Math.floor(Math.random() * nouns.length)];
        await veilrumDb.from('anon_author_map').insert({ real_user_id: user!.id, anon_alias: alias, context: 'codetalk' });
      }

      await veilrumDb.from('codetalk_entries').insert({
        user_id: user!.id, keyword_id: keyword.id, keyword: keyword.keyword,
        definition: answers.definition ?? '', imprinting_moment: answers.imprinting_moment ?? '',
        root_cause: answers.root_cause ?? '', is_public: isPublic, anon_alias: alias,
        entry_date: new Date().toISOString().slice(0, 10),
      });
      const { data: currentProfile } = await veilrumDb.from('user_profiles')
        .select('codetalk_day, streak_count').eq('user_id', user!.id).single();
      const nextDay = Math.min((currentProfile?.codetalk_day ?? 1) + 1, 100);
      const newStreak = (currentProfile?.streak_count ?? 0) + 1;
      await veilrumDb.from('user_profiles')
        .update({ codetalk_day: nextDay, streak_count: newStreak }).eq('user_id', user!.id);
    },
    onSuccess: () => {
      toast({ title: '기록 저장 완료 ✓' });
      setAnswers({}); setStep(0);
      qc.invalidateQueries({ queryKey: ['codetalk-profile'] });
      qc.invalidateQueries({ queryKey: ['codetalk-today'] });
      qc.invalidateQueries({ queryKey: ['codetalk-entry-today'] });
      qc.invalidateQueries({ queryKey: ['codetalk-history'] });
    },
  });

  const feedOpen = isPublicFeedOpen();

  const { data: publicFeed } = useQuery({
    queryKey: ['codetalk-public-feed', keyword?.id, keyword?.day_number],
    queryFn: async () => {
      const { data } = await veilrumDb.from('codetalk_entries')
        .select('anon_alias, keyword, definition, imprinting_moment, root_cause, created_at, entry_date')
        .eq('keyword_id', keyword!.id).eq('is_public', true).neq('user_id', user!.id)
        .order('created_at', { ascending: false }).limit(20);
      const virtualEntries = getVirtualCodetalkEntries(keyword!.day_number).map(v => ({
        anon_alias: v.anon_alias, keyword: v.keyword, definition: v.definition,
        created_at: v.created_at, entry_date: new Date(v.created_at).toISOString().slice(0, 10), is_virtual: true,
      }));
      const combined = [...(data ?? []).map((d: any) => ({ ...d, is_virtual: false })), ...virtualEntries]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return combined;
    },
    enabled: !!user && !!keyword && feedOpen,
  });

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  const handleNext = () => {
    if (!answers[currentStep.key]?.trim()) return;
    if (isLastStep) saveMutation.mutate();
    else setStep(step + 1);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="px-4 py-6 space-y-5 max-w-sm mx-auto">
      <KeywordCard keyword={keyword} streakCount={streakCount} streakMessage={streakMessage} />

      {/* 기록 영역 */}
      {!todayEntry ? (
        <div className="bg-card border rounded-2xl p-5 space-y-4">
          <div className="flex gap-2 items-center">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors
                  ${i < step ? 'bg-primary text-primary-foreground' : i === step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs ${i === step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{s.label}</span>
                {i < STEPS.length - 1 && <div className="w-4 h-px bg-muted" />}
              </div>
            ))}
          </div>
          <p className="text-sm font-medium">{currentStep.prompt}</p>
          <Textarea key={currentStep.key} placeholder="자유롭게 적어주세요 (최대 500자)" maxLength={500}
            value={answers[currentStep.key] ?? ''} onChange={e => setAnswers({ ...answers, [currentStep.key]: e.target.value })} className="h-28 resize-none" />
          {isLastStep && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              <span>{isPublic ? '커뮤니티 공개' : '비공개'}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            {step > 0 ? <button onClick={() => setStep(step - 1)} className="text-xs text-muted-foreground underline underline-offset-2">이전</button> : <div />}
            <Button size="sm" onClick={handleNext} disabled={!answers[currentStep.key]?.trim() || saveMutation.isPending}>
              {isLastStep ? (saveMutation.isPending ? '저장 중...' : '저장') : '다음'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-card border rounded-2xl p-5 space-y-3">
          <p className="text-xs text-muted-foreground">오늘의 기록 ✓</p>
          {todayEntry.definition && (<div><p className="text-xs text-muted-foreground mb-1">정의</p><p className="text-sm leading-relaxed">{todayEntry.definition}</p></div>)}
          {todayEntry.imprinting_moment && (<div><p className="text-xs text-muted-foreground mb-1">각인</p><p className="text-sm leading-relaxed">{todayEntry.imprinting_moment}</p></div>)}
          {todayEntry.root_cause && (<div><p className="text-xs text-muted-foreground mb-1">원인</p><p className="text-sm leading-relaxed">{todayEntry.root_cause}</p></div>)}
        </div>
      )}

      {/* 지난 기록 */}
      {pastEntries && pastEntries.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">지난 기록</p>
          {pastEntries.map((e: any) => (
            <div key={e.id} className="bg-card border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">DAY {e.codetalk_keywords?.day_number} · {e.codetalk_keywords?.keyword ?? e.keyword}</span>
                <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{e.definition}</p>
            </div>
          ))}
        </div>
      )}

      <StoryFeed
        keyword={keyword}
        currentDay={currentDay}
        feedOpen={feedOpen}
        publicFeed={publicFeed}
        todayEntry={todayEntry}
        userId={user?.id}
      />
    </div>
  );
}
