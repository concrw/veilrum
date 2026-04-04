// CodetalkTab — 100-day keyword recording tab
import type { VeilrumCodetalkEntry, VeilrumCodetalkKeyword } from '@/integrations/supabase/veilrum-types';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { UseMutationResult } from '@tanstack/react-query';

interface CodetalkTabProps {
  keyword: VeilrumCodetalkKeyword | null | undefined;
  todayEntry: VeilrumCodetalkEntry | null | undefined;
  pastEntries: VeilrumCodetalkEntry[] | undefined;
  entry: string;
  setEntry: (v: string) => void;
  isPublic: boolean;
  setIsPublic: (v: boolean) => void;
  saveMutation: UseMutationResult<void, Error, void, unknown>;
  aiInsight?: string | null;
  aiInsightLoading?: boolean;
  onRequestInsight?: () => void;
}

export default function CodetalkTab({
  keyword,
  todayEntry,
  pastEntries,
  entry,
  setEntry,
  isPublic,
  setIsPublic,
  saveMutation,
  aiInsight,
  aiInsightLoading,
  onRequestInsight,
}: CodetalkTabProps) {
  return (
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
        <div className="bg-card border rounded-2xl p-5 space-y-3">
          <p className="text-xs text-muted-foreground mb-2">오늘의 기록 ✓</p>
          {todayEntry.definition && (
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground">정의</p>
              <p className="text-sm leading-relaxed">{todayEntry.definition}</p>
            </div>
          )}
          {todayEntry.imprinting_moment && (
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground">각인</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{todayEntry.imprinting_moment}</p>
            </div>
          )}
          {todayEntry.root_cause && (
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground">뿌리</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{todayEntry.root_cause}</p>
            </div>
          )}
          {!todayEntry.definition && todayEntry.content && (
            <p className="text-sm leading-relaxed">{todayEntry.content}</p>
          )}

          {/* AI 인사이트 */}
          {aiInsight && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-1">
              <p className="text-xs text-primary font-medium">엠버의 인사이트</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{aiInsight}</p>
            </div>
          )}
          {!aiInsight && onRequestInsight && (
            <Button size="sm" variant="outline" onClick={onRequestInsight}
              disabled={aiInsightLoading} className="w-full">
              {aiInsightLoading ? '인사이트 생성 중...' : 'AI 인사이트 보기'}
            </Button>
          )}
        </div>
      )}

      {/* 과거 기록 */}
      {pastEntries && pastEntries.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">지난 기록</p>
          {pastEntries.map((e: VeilrumCodetalkEntry) => (
            <div key={e.id} className="bg-card border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">DAY {e.codetalk_keywords?.day_number} · {e.codetalk_keywords?.keyword}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(e.entry_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              {e.definition ? (
                <p className="text-xs text-muted-foreground line-clamp-2">{e.definition}</p>
              ) : (
                <p className="text-xs text-muted-foreground line-clamp-2">{e.content}</p>
              )}
              {(e.imprinting_moment || e.root_cause) && (
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  {[e.imprinting_moment && '각인', e.root_cause && '뿌리'].filter(Boolean).join(' · ')} 기록됨
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
