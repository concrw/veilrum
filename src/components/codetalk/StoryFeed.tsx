import { useState, useMemo } from 'react';
import { C, alpha } from '@/lib/colors';
import { KEYWORD_MAP, getParticipantCount, getVirtualFeedUpToDay } from '@/lib/virtualCodetalk';

interface FeedEntry {
  anon_alias?: string;
  created_at: string;
  definition?: string;
  imprinting_moment?: string;
  root_cause?: string;
  is_virtual?: boolean;
}

interface StoryFeedProps {
  keyword: { keyword?: string; day_number?: number } | null | undefined;
  currentDay: number;
  feedOpen: boolean;
  publicFeed: FeedEntry[] | undefined;
  todayEntry: FeedEntry | null | undefined;
  userId: string | undefined;
}

export function StoryFeed({ keyword, currentDay, feedOpen, publicFeed, todayEntry, userId }: StoryFeedProps) {
  const [feedTab, setFeedTab] = useState<'today' | 'past'>('today');

  const pastDayFeed = useMemo(() => {
    if (!feedOpen || currentDay <= 1) return [];
    return getVirtualFeedUpToDay(currentDay, 15);
  }, [feedOpen, currentDay]);

  return (
    <>
      {/* 퍼블릭스토리 피드 */}
      {feedOpen ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFeedTab('today')}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                feedTab === 'today' ? 'text-white' : 'text-muted-foreground bg-muted'
              }`}
              style={feedTab === 'today' ? { backgroundColor: C.amber } : undefined}
            >
              오늘의 이야기
            </button>
            <button
              onClick={() => setFeedTab('past')}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                feedTab === 'past' ? 'text-white' : 'text-muted-foreground bg-muted'
              }`}
              style={feedTab === 'past' ? { backgroundColor: C.frost } : undefined}
            >
              지난 이야기
            </button>
          </div>

          {feedTab === 'today' ? (
            publicFeed && publicFeed.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    "<span style={{ color: C.amber }}>{keyword?.keyword}</span>" 에 대한 이야기
                  </p>
                  <span className="text-xs text-muted-foreground">{publicFeed.length}명 참여</span>
                </div>
                {publicFeed.map((e: FeedEntry, i: number) => (
                  <div key={i} className="bg-card border rounded-xl p-4 space-y-2"
                    style={{ borderLeftWidth: 3, borderLeftColor: e.is_virtual ? C.frost : C.amber }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium" style={{ color: C.amber }}>
                        {e.anon_alias ?? '익명'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(e.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {e.definition && (
                        <div>
                          <span className="text-[10px] text-muted-foreground">정의</span>
                          <p className="text-sm leading-relaxed line-clamp-2">{e.definition}</p>
                        </div>
                      )}
                      {e.imprinting_moment && (
                        <div>
                          <span className="text-[10px] text-muted-foreground">각인</span>
                          <p className="text-sm leading-relaxed line-clamp-2 text-muted-foreground">{e.imprinting_moment}</p>
                        </div>
                      )}
                      {e.root_cause && (
                        <div>
                          <span className="text-[10px] text-muted-foreground">뿌리</span>
                          <p className="text-sm leading-relaxed line-clamp-2 text-muted-foreground">{e.root_cause}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border rounded-xl p-4 text-center space-y-1">
                <p className="text-xs font-medium">아직 오늘의 이야기가 없어요</p>
                <p className="text-xs text-muted-foreground">먼저 기록하고, 다른 사람들의 정의를 확인해보세요</p>
              </div>
            )
          ) : (
            pastDayFeed.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  DAY 1~{currentDay - 1}의 이야기 (최근 7일)
                </p>
                {pastDayFeed.map((e, i) => (
                  <div key={i} className="bg-card border rounded-xl p-4 space-y-2"
                    style={{ borderLeftWidth: 3, borderLeftColor: C.frost }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: alpha(C.frost, 0.15), color: C.frost }}>
                          DAY {e.day_number}
                        </span>
                        <span className="text-xs font-medium" style={{ color: C.frost }}>
                          {e.anon_alias}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{e.keyword}</span>
                    </div>
                    <p className="text-sm leading-relaxed line-clamp-3">{e.definition}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground">DAY 2부터 이전 이야기를 볼 수 있어요</p>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="bg-card border rounded-xl p-4 text-center space-y-1">
          <p className="text-xs font-medium">오전 6시에 오늘의 이야기가 공개됩니다</p>
          <p className="text-xs text-muted-foreground">다른 사람들의 정의가 여기에 나타나요</p>
        </div>
      )}

      {/* 어제의 하이라이트 넛지 */}
      {todayEntry && currentDay > 1 && (
        <div className="border rounded-xl p-4 space-y-2"
          style={{ backgroundColor: alpha(C.frost, 0.05), borderColor: alpha(C.frost, 0.2) }}>
          <p className="text-xs font-medium" style={{ color: C.frost }}>
            어제의 키워드: {KEYWORD_MAP[currentDay - 1] ?? '—'}
          </p>
          <p className="text-sm text-muted-foreground">
            총 {getParticipantCount(currentDay - 1) + Math.floor(Math.random() * 3)}명이 자신만의 정의를 남겼어요.
            {currentDay < 100
              ? ` 내일은 DAY ${currentDay + 1}의 키워드가 기다리고 있습니다.`
              : ' 100일의 여정이 마무리에 가까워지고 있어요.'}
          </p>
        </div>
      )}
    </>
  );
}
