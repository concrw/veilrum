// Set — 이제 바꾸고 싶다
// 기능: CODETALK 100일 키워드 기록 + 경계 설정 / 합의 체크리스트
// 현재: CODETALK 완전 구현 + 퍼블릭스토리 피드 예정

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

type Tab = 'codetalk' | 'feed';

export default function SetPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('codetalk');
  const [entry, setEntry] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const { data: keyword, isLoading } = useQuery({
    queryKey: ['codetalk-today', user?.id],
    queryFn: async () => {
      const { data: profile } = await (supabase as any)
        .schema('veilrum').from('user_profiles')
        .select('codetalk_day').eq('id', user!.id).single();
      const day = profile?.codetalk_day ?? 1;
      const { data } = await (supabase as any)
        .schema('veilrum').from('codetalk_keywords')
        .select('*').eq('day_number', day).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: todayEntry } = useQuery({
    queryKey: ['codetalk-entry-today', user?.id, keyword?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await (supabase as any)
        .schema('veilrum').from('codetalk_entries')
        .select('*').eq('user_id', user!.id).eq('keyword_id', keyword.id)
        .eq('entry_date', today).single();
      return data;
    },
    enabled: !!user && !!keyword,
  });

  const { data: pastEntries } = useQuery({
    queryKey: ['codetalk-history', user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .schema('veilrum').from('codetalk_entries')
        .select('*, codetalk_keywords(keyword, day_number)')
        .eq('user_id', user!.id)
        .order('entry_date', { ascending: false })
        .limit(10);
      return data ?? [];
    },
    enabled: !!user,
  });

  // 퍼블릭 스토리 피드
  const { data: publicFeed } = useQuery({
    queryKey: ['codetalk-public', keyword?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await (supabase as any)
        .schema('veilrum').from('codetalk_entries')
        .select('id, content, created_at, user_id')
        .eq('keyword_id', keyword.id)
        .eq('is_public', true)
        .eq('entry_date', today)
        .order('created_at', { ascending: false })
        .limit(30);
      return data ?? [];
    },
    enabled: !!keyword && tab === 'feed',
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      await (supabase as any).schema('veilrum').from('codetalk_entries').upsert({
        user_id: user!.id,
        keyword_id: keyword.id,
        entry_date: today,
        content: entry,
        is_public: isPublic,
      });
      const { data: profile } = await (supabase as any)
        .schema('veilrum').from('user_profiles')
        .select('codetalk_day').eq('id', user!.id).single();
      const nextDay = Math.min((profile?.codetalk_day ?? 1) + 1, 100);
      await (supabase as any).schema('veilrum').from('user_profiles')
        .update({ codetalk_day: nextDay }).eq('id', user!.id);
    },
    onSuccess: () => {
      toast({ title: '기록 저장 완료 ✓' });
      setEntry('');
      qc.invalidateQueries({ queryKey: ['codetalk-today'] });
      qc.invalidateQueries({ queryKey: ['codetalk-history'] });
      qc.invalidateQueries({ queryKey: ['codetalk-public'] });
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="px-4 py-6 max-w-sm mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Set</h2>
        <p className="text-sm text-muted-foreground mt-1">오늘의 언어로 나를 재설정해요.</p>
      </div>

      {/* 탭 */}
      <div className="bg-card border rounded-2xl p-1 flex">
        {([['codetalk', '오늘의 키워드'], ['feed', '퍼블릭 스토리']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors
              ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'codetalk' ? (
        <>
          {/* 오늘의 키워드 카드 */}
          <div className="bg-card border rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">DAY {keyword?.day_number ?? 1} / 100</span>
              <div className="h-1.5 w-24 bg-muted rounded-full">
                <div className="h-1.5 bg-primary rounded-full"
                  style={{ width: `${((keyword?.day_number ?? 1) / 100) * 100}%` }} />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">오늘의 키워드</p>
              <h3 className="text-2xl font-bold">{keyword?.keyword ?? '—'}</h3>
              {keyword?.description && (
                <p className="text-sm text-muted-foreground mt-1">{keyword.description}</p>
              )}
            </div>
          </div>

          {/* 기록 입력 */}
          {!todayEntry ? (
            <div className="bg-card border rounded-2xl p-5 space-y-4">
              <p className="text-sm font-medium">오늘 이 키워드가 내 관계에서 어떻게 나타났나요?</p>
              <Textarea
                placeholder="자유롭게 기록해 보세요 (최대 500자)"
                maxLength={500}
                value={entry}
                onChange={e => setEntry(e.target.value)}
                className="h-28 resize-none"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                  <span>{isPublic ? '스토리 공개' : '비공개'}</span>
                </div>
                <Button size="sm" onClick={() => saveMutation.mutate()}
                  disabled={!entry.trim() || saveMutation.isPending}>
                  저장
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card border rounded-2xl p-5">
              <p className="text-xs text-muted-foreground mb-2">오늘의 기록 ✓</p>
              <p className="text-sm leading-relaxed">{todayEntry.content}</p>
            </div>
          )}

          {/* 과거 기록 */}
          {pastEntries && pastEntries.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">지난 기록</p>
              {pastEntries.map((e: any) => (
                <div key={e.id} className="bg-card border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">DAY {e.codetalk_keywords?.day_number} · {e.codetalk_keywords?.keyword}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(e.entry_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{e.content}</p>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* 퍼블릭 스토리 피드 */
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            오늘 키워드 <span className="font-medium text-foreground">"{keyword?.keyword}"</span>에 대한 이야기들
          </p>
          {publicFeed && publicFeed.length > 0 ? (
            publicFeed.map((item: any) => (
              <div key={item.id} className="bg-card border rounded-xl p-4 space-y-2">
                <p className="text-sm leading-relaxed">{item.content}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">
              아직 오늘의 스토리가 없어요.<br />첫 번째로 공유해보세요.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
