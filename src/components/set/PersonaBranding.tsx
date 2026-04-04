// #31 페르소나 브랜딩 — 가면별 브랜딩 전략 + #32 자기 선언문
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MASK_PROFILES } from '@/lib/vfileAlgorithm';
import { veilrumDb } from '@/integrations/supabase/client';

export default function PersonaBranding() {
  const { user, primaryMask } = useAuth();
  const [declaration, setDeclaration] = useState('');
  const [saved, setSaved] = useState(false);

  const profile = MASK_PROFILES.find(m => m.nameKo === primaryMask || m.mskCode === primaryMask);
  if (!profile) return null;

  const brandStrategy = {
    PWR: { strength: '결단력과 리더십', shadow: '통제 욕구', reframe: '안전한 공간을 만드는 사람' },
    NRC: { strength: '독립성과 자기보호', shadow: '고립과 불신', reframe: '경계를 아는 사람' },
    SCP: { strength: '자율성과 자기표현', shadow: '반항적 패턴', reframe: '자유와 연결을 함께 추구하는 사람' },
    MKV: { strength: '매력과 영향력', shadow: '진짜 자아 숨김', reframe: '가면 없이도 빛나는 사람' },
    MNY: { strength: '유머와 자원 활용', shadow: '감정 회피', reframe: '진지함과 유쾌함을 겸비한 사람' },
    PSP: { strength: '탐구심과 개방성', shadow: '안전기지 부재', reframe: '안전한 모험가' },
    EMP: { strength: '공감력과 연결', shadow: '자기 소거', reframe: '자기와 타인을 동시에 돌보는 사람' },
    GVR: { strength: '헌신과 관대함', shadow: '경계 부재', reframe: '건강하게 주고받는 사람' },
    APV: { strength: '성취력과 끈기', shadow: '조건부 자기가치', reframe: '존재 자체로 충분한 사람' },
    DEP: { strength: '연결 욕구와 정서적 깊이', shadow: '의존 패턴', reframe: '혼자서도 단단한 사람' },
    AVD: { strength: '분석력과 통찰', shadow: '감정 회피', reframe: '감정과 이성을 통합하는 사람' },
    SAV: { strength: '도덕성과 헌신', shadow: '구원자 컴플렉스', reframe: '자신도 구원받을 수 있는 사람' },
  }[profile.mskCode] ?? { strength: '고유한 강점', shadow: '무의식 패턴', reframe: '성장하는 사람' };

  const handleSave = async () => {
    if (!user || !declaration.trim()) return;
    await veilrumDb.from('user_profiles').update({
      declaration: declaration.trim(),
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id);
    setSaved(true);
  };

  return (
    <div className="space-y-4">
      {/* 페르소나 브랜딩 (#31) */}
      <div className="bg-card border rounded-2xl p-5 space-y-3">
        <p className="text-xs text-muted-foreground">페르소나 브랜딩</p>
        <h3 className="font-semibold" style={{ color: profile.color }}>{profile.nameKo}의 리브랜딩</h3>
        <div className="space-y-2">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2">
            <p className="text-[10px] text-emerald-600">강점</p>
            <p className="text-xs">{brandStrategy.strength}</p>
          </div>
          <div className="bg-red-400/5 border border-red-400/20 rounded-xl px-3 py-2">
            <p className="text-[10px] text-red-500">그림자</p>
            <p className="text-xs">{brandStrategy.shadow}</p>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
            <p className="text-[10px] text-primary">리프레이밍</p>
            <p className="text-xs font-medium">{brandStrategy.reframe}</p>
          </div>
        </div>
      </div>

      {/* 자기 선언문 (#32) */}
      <div className="bg-card border rounded-2xl p-5 space-y-3">
        <p className="text-xs text-muted-foreground">나의 관계 선언문</p>
        <p className="text-xs text-muted-foreground">
          "{profile.coreNeed}"를 바탕으로, 당신만의 관계 선언문을 작성해보세요.
        </p>
        <textarea
          value={declaration}
          onChange={e => setDeclaration(e.target.value)}
          placeholder={`예: 나는 ${brandStrategy.reframe}이다. ${profile.coreNeed}를 위해 매일 한 걸음씩 나아간다.`}
          maxLength={300}
          className="w-full bg-background border rounded-lg p-2.5 text-sm resize-none h-24 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button onClick={handleSave} disabled={!declaration.trim() || saved}
          className="w-full text-xs py-2.5 rounded-lg bg-primary text-white disabled:opacity-40">
          {saved ? '저장 완료' : '선언문 저장'}
        </button>
      </div>
    </div>
  );
}
