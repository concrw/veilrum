// Get — 뿌리가 궁금하다
// 기능: PRIPER 기반 자기 구조 탐색, 가면/욕망/두려움 요약, 멀티페르소나 맵
// 현재: PRIPER 결과 표시 + 멀티페르소나 맵 (프리미엄 예정)

import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const MASK_LABELS: Record<string, string> = {
  NRC: '나르시시스트', MKV: '마키아벨리', SCP: '소시오패스', PSP: '사이코패스',
  MNY: '머니', PWR: '파워', EMP: '엠패스', APV: '어프루벌',
  SAV: '세이버', AVD: '어보이던트', DEP: '디펜던트', GVR: '기버',
};

const AXIS_LABELS: Record<string, string> = {
  A: '자기인식', B: '감정조절', C: '욕구표현', D: '관계유지',
};

export default function GetPage() {
  const { user, primaryMask, axisScores } = useAuth();
  const navigate = useNavigate();

  const { data: perspective } = useQuery({
    queryKey: ['prime-perspective', user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .schema('veilrum').from('prime_perspectives')
        .select('perspective, summary')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="px-4 py-6 max-w-sm mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Get</h2>
        <p className="text-sm text-muted-foreground mt-1">나를 이루는 구조를 봐요.</p>
      </div>

      {/* 가면 */}
      <div className="bg-card border rounded-2xl p-5 space-y-3">
        <p className="text-xs text-muted-foreground">나의 가면</p>
        <p className="text-2xl font-bold">
          {primaryMask ? (MASK_LABELS[primaryMask] ?? primaryMask) : '—'}
        </p>
        {primaryMask && (
          <p className="text-xs text-muted-foreground">코드: {primaryMask}</p>
        )}
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

      {/* Prime Perspective */}
      {perspective && (
        <div className="bg-card border rounded-2xl p-5 space-y-2">
          <p className="text-xs text-muted-foreground">Prime Perspective</p>
          <p className="font-semibold">{perspective.perspective}</p>
          {perspective.summary && (
            <p className="text-xs text-muted-foreground leading-relaxed">{perspective.summary}</p>
          )}
        </div>
      )}

      {/* 멀티페르소나 맵 — 프리미엄 */}
      <div className="bg-card border rounded-2xl p-5 space-y-3 opacity-60">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">멀티페르소나 맵</p>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">프리미엄</span>
        </div>
        <p className="text-xs text-muted-foreground">각 페르소나의 자원 배분과 시간축 변화를 시각화합니다.</p>
      </div>

      <Button variant="outline" className="w-full" onClick={() => navigate('/onboarding/priper/start')}>
        PRIPER 재진단
      </Button>
    </div>
  );
}
