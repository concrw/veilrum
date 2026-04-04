// IdentityTab — V-File mask display, MSK codes, axis scores, persona map, pattern analysis
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { MASK_PROFILES, VFILE_CONTEXT_LABELS } from '@/lib/vfileAlgorithm';
import type { VFileContext } from '@/lib/vfileAlgorithm';
import { useAuth } from '@/context/AuthContext';
import { veilrumDb } from '@/integrations/supabase/client';

// M43 확정 12종 + MSK 코드 매핑
const MSK_LABELS: Record<string, { nameKo: string; category: string }> = {
  PWR: { nameKo: '통제자', category: '포식형' },
  NRC: { nameKo: '공허자', category: '포식형' },
  SCP: { nameKo: '반항자', category: '포식형' },
  MKV: { nameKo: '매혹자', category: '포식형' },
  MNY: { nameKo: '유희자', category: '포식형' },
  PSP: { nameKo: '탐험자', category: '포식형' },
  EMP: { nameKo: '거울', category: '피식형' },
  GVR: { nameKo: '돌봄자', category: '피식형' },
  APV: { nameKo: '성취자', category: '피식형' },
  DEP: { nameKo: '희생자', category: '피식형' },
  AVD: { nameKo: '현자', category: '피식형' },
  SAV: { nameKo: '순교자', category: '피식형' },
};

// V-File 가면명 → MSK 코드 역매핑 (DB에 한글 가면명이 저장된 경우)
const NAME_TO_MSK: Record<string, string> = {};
MASK_PROFILES.forEach(m => {
  NAME_TO_MSK[m.nameKo] = m.mskCode;
  NAME_TO_MSK[m.id] = m.mskCode;
});

function resolveMask(primaryMask: string): { code: string; nameKo: string; category: string } | null {
  // MSK 코드로 직접 매칭
  if (MSK_LABELS[primaryMask]) {
    return { code: primaryMask, ...MSK_LABELS[primaryMask] };
  }
  // 한글 가면명으로 역매핑
  const mskCode = NAME_TO_MSK[primaryMask];
  if (mskCode && MSK_LABELS[mskCode]) {
    return { code: mskCode, ...MSK_LABELS[mskCode] };
  }
  return null;
}

const AXIS_LABELS: Record<string, string> = {
  A: '애착', B: '소통', C: '욕구표현', D: '역할',
};

const ATTACHMENT_LABELS: Record<string, string> = {
  secure: '안정형', anxious: '불안형', avoidant: '회피형', disorganized: '혼란형',
};

function PremiumLock({ label, onUnlock }: { label: string; onUnlock?: () => void }) {
  return (
    <div
      className="bg-card border border-dashed rounded-2xl p-6 text-center space-y-2 opacity-70 cursor-pointer hover:opacity-90 transition-opacity"
      onClick={onUnlock}
    >
      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">프리미엄</span>
      <p className="text-sm text-muted-foreground mt-2">{label}</p>
      <p className="text-xs text-muted-foreground">탭하면 Pro 플랜을 확인할 수 있어요</p>
    </div>
  );
}

interface IdentityTabProps {
  primaryMask: string | null;
  axisScores: Record<string, number> | null;
  pp: any;
  isPro: boolean;
  tryAccess: (feature: string) => void;
  totalSessions: number;
  ventCount: number;
  digCount: number;
  setCount: number;
  topEmotions: [string, number][];
  topDomain: { domain: string; cnt: number } | undefined;
  recentKeywords: string[];
  signalTotal: number;
}

export default function IdentityTab({
  primaryMask, axisScores, pp, isPro, tryAccess,
  totalSessions, ventCount, digCount, setCount,
  topEmotions, topDomain, recentKeywords, signalTotal,
}: IdentityTabProps) {
  const navigate = useNavigate();
  const { user, personaContextsCompleted } = useAuth();

  // 맥락별 페르소나 프로필 조회
  const { data: personas } = useQuery({
    queryKey: ['persona-profiles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await veilrumDb
        .from('persona_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('rank_order', { ascending: true });
      return data ?? [];
    },
    enabled: !!user,
  });

  const contexts: VFileContext[] = ['general', 'social', 'secret'];
  const completedSet = new Set(personaContextsCompleted);

  const startDiagnosis = (ctx: VFileContext) => {
    navigate('/onboarding/vfile/questions', { state: { context: ctx, fromGet: true } });
  };

  return (
    <>
      {/* V-File 가면 + 기원 프로필 */}
      <div className="bg-card border rounded-2xl p-5 space-y-4">
        <p className="text-xs text-muted-foreground">나의 V-File</p>
        {(() => {
          const resolved = primaryMask ? resolveMask(primaryMask) : null;
          if (!resolved) return <p className="text-2xl font-bold">—</p>;
          const profile = MASK_PROFILES.find(m => m.mskCode === resolved.code);
          return (
            <>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{resolved.nameKo}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{resolved.code}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${resolved.category === '포식형' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {resolved.category}
                  </span>
                </div>
                {profile && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{profile.description}</p>
                )}
              </div>

              {/* 기원 심리 프로필 */}
              {profile && (
                <div className="space-y-2.5 pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground">기원 프로필</p>
                  <div className="grid gap-2">
                    <div className="bg-muted/50 rounded-xl px-3.5 py-2.5 space-y-0.5">
                      <p className="text-[10px] text-muted-foreground">핵심 상처</p>
                      <p className="text-xs font-medium">{profile.coreWound}</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl px-3.5 py-2.5 space-y-0.5">
                      <p className="text-[10px] text-muted-foreground">핵심 두려움</p>
                      <p className="text-xs font-medium">{profile.coreFear}</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl px-3.5 py-2.5 space-y-0.5">
                      <p className="text-[10px] text-muted-foreground">핵심 필요</p>
                      <p className="text-xs font-medium">{profile.coreNeed}</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl px-3.5 py-2.5 space-y-0.5">
                      <p className="text-[10px] text-muted-foreground">생성 경로</p>
                      <p className="text-xs font-medium">{profile.genPath}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/home/vent', {
                      state: {
                        originExplore: true,
                        systemPrompt: `사용자의 V-File 가면은 "${profile.nameKo}"(${profile.mskCode}, ${profile.category === 'predatory' ? '포식형' : '피식형'})입니다. 핵심 상처: "${profile.coreWound}", 핵심 두려움: "${profile.coreFear}", 생성 경로: "${profile.genPath}". 이 정보를 바탕으로 사용자가 이 가면이 어떤 경험에서 형성되었는지 스스로 탐색하도록 부드럽게 질문해 주세요. 판단하지 말고, 공감하면서 기원을 함께 찾아가세요.`,
                      },
                    })}
                    className="w-full text-xs text-center py-2.5 rounded-xl border border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-colors"
                  >
                    이 가면의 기원을 AI와 탐색하기
                  </button>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* 축 점수 */}
      {axisScores && (
        <div className="bg-card border rounded-2xl p-5 space-y-3">
          <p className="text-xs text-muted-foreground">관계 역량 4축</p>
          <div className="space-y-2">
            {(Object.entries(axisScores) as [string, number][]).map(([axis, score]) => (
              <div key={axis} className="flex items-center gap-3">
                <span className="text-xs w-20 text-muted-foreground">{AXIS_LABELS[axis] ?? axis}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full">
                  <div className="h-1.5 bg-primary rounded-full transition-all" style={{ width: `${score}%` }} />
                </div>
                <span className="text-xs font-medium w-8 text-right">{score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 애착 유형 */}
      {pp?.attachment_type && (
        <div className="bg-card border rounded-2xl p-5 space-y-1">
          <p className="text-xs text-muted-foreground">애착 유형</p>
          <p className="font-semibold">{ATTACHMENT_LABELS[pp.attachment_type] ?? pp.attachment_type}</p>
        </div>
      )}

      {/* Prime Perspective */}
      {pp?.perspective_text && (
        <div className="bg-card border rounded-2xl p-5 space-y-2">
          <p className="text-xs text-muted-foreground">Prime Perspective</p>
          <p className="font-semibold">{pp.perspective_text}</p>
        </div>
      )}

      {/* 세 개의 나 — 멀티페르소나 V-File */}
      <div className="bg-card border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">세 개의 나</p>
          <span className="text-xs text-muted-foreground">
            {personas?.length ?? 0}/3 완료
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          같은 질문이지만 맥락이 달라지면 다른 가면이 나타납니다
        </p>
        <div className="space-y-2.5">
          {contexts.map((ctx) => {
            const ctxLabel = VFILE_CONTEXT_LABELS[ctx];
            const persona = personas?.find((p: any) => p.vfile_context === ctx);
            const resolved = persona ? resolveMask(persona.primary_mask ?? persona.msk_code) : null;

            return (
              <div key={ctx} className="bg-muted/50 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{ctxLabel.icon}</span>
                    <span className="text-sm font-medium">{ctxLabel.ko}</span>
                  </div>
                  {resolved ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono bg-background px-1.5 py-0.5 rounded" style={{ color: persona.color_hex }}>
                        {resolved.code}
                      </span>
                      <span className="text-sm font-semibold" style={{ color: persona.color_hex }}>
                        {resolved.nameKo}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => startDiagnosis(ctx)}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      {ctx === 'general' ? '재분석' : '분석하기'}
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{ctxLabel.desc}</p>
                {resolved && persona.axis_scores && (
                  <div className="flex gap-3 pt-1">
                    {(Object.entries(persona.axis_scores) as [string, number][]).map(([axis, score]) => (
                      <div key={axis} className="flex-1 text-center">
                        <div className="h-1 bg-background rounded-full mb-1">
                          <div className="h-1 rounded-full" style={{ width: `${score}%`, backgroundColor: persona.color_hex }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{AXIS_LABELS[axis]}</span>
                      </div>
                    ))}
                  </div>
                )}
                {resolved && (
                  <button
                    onClick={() => startDiagnosis(ctx)}
                    className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                  >
                    재분석
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 누적 신호 패턴 분석 */}
      {totalSessions > 0 && (
        <div className="bg-card border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">누적 패턴 분석</p>
            <span className="text-xs font-medium text-primary">총 {totalSessions}회 입력</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ventCount > 0 && (
              <div className="bg-muted/50 rounded-xl p-3 text-center space-y-1">
                <p className="text-xl font-bold">{ventCount}</p>
                <p className="text-xs text-muted-foreground">Vent 대화</p>
              </div>
            )}
            {digCount > 0 && (
              <div className="bg-muted/50 rounded-xl p-3 text-center space-y-1">
                <p className="text-xl font-bold">{digCount}</p>
                <p className="text-xs text-muted-foreground">Dig 탐색</p>
              </div>
            )}
            {setCount > 0 && (
              <div className="bg-muted/50 rounded-xl p-3 text-center space-y-1">
                <p className="text-xl font-bold">{setCount}</p>
                <p className="text-xs text-muted-foreground">Set 기록</p>
              </div>
            )}
          </div>
          {topEmotions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">자주 느끼는 감정</p>
              <div className="flex flex-wrap gap-1.5">
                {topEmotions.map(([emo, count]) => (
                  <span key={emo} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                    {emo} <span className="opacity-60">{count}회</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {topDomain && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">반복 탐색 패턴</p>
              <p className="text-sm font-medium">
                {topDomain.domain}
                <span className="text-xs text-muted-foreground font-normal ml-1">({topDomain.cnt}회 탐색)</span>
              </p>
            </div>
          )}
          {recentKeywords.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">최근 Set 키워드</p>
              <div className="flex flex-wrap gap-1.5">
                {recentKeywords.map((kw: string, i: number) => (
                  <span key={i} className="text-xs bg-muted px-2.5 py-1 rounded-full">{kw}</span>
                ))}
              </div>
            </div>
          )}
          {signalTotal > 0 && (
            <p className="text-xs text-muted-foreground border-t pt-3">
              총 {signalTotal}개 신호 누적 — 사용할수록 분석이 정교해져요
            </p>
          )}
        </div>
      )}

      <Button variant="outline" className="w-full" onClick={() => startDiagnosis('general')}>
        V-File 재분석
      </Button>
    </>
  );
}
