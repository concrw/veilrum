// #37 RelationSHIP 12 코칭 + #40 관계 결론 착지 + #41 대화법/질문법 학습
import { useState } from 'react';

const COACHING_WEEKS = [
  { week: 1, title: '나를 알기', topic: '나의 관계 패턴 인식', exercise: 'V-File 결과를 되돌아보고, 가장 놀라웠던 점 1가지 적기' },
  { week: 2, title: '감정 읽기', topic: '감정 언어 확장', exercise: '오늘 느낀 감정에 정확한 이름 붙이기 (불안→걱정? 두려움? 초조?)' },
  { week: 3, title: '경계 설정', topic: '건강한 경계 연습', exercise: '이번 주 한 번 "아니요"라고 말하기' },
  { week: 4, title: '욕구 표현', topic: '필요한 것 말하기', exercise: '"나는 ___이 필요해"로 시작하는 문장 매일 1개 쓰기' },
  { week: 5, title: '경청하기', topic: '반응하지 않고 듣기', exercise: '상대 말을 끝까지 듣고, 요약해서 확인하기' },
  { week: 6, title: '갈등 다루기', topic: '비폭력적 소통', exercise: '"나는 ___할 때 ___을 느껴" 형식으로 갈등 표현' },
  { week: 7, title: '용서하기', topic: '과거 놓아주기', exercise: '용서 편지 쓰기 (보내지 않아도 됨)' },
  { week: 8, title: '신뢰 쌓기', topic: '작은 약속 지키기', exercise: '이번 주 3가지 작은 약속을 만들고 지키기' },
  { week: 9, title: '친밀감', topic: '취약함 보여주기', exercise: '가까운 사람에게 약한 모습 하나 보여주기' },
  { week: 10, title: '감사하기', topic: '관계 속 감사 발견', exercise: '매일 관계에서 감사한 점 1가지 기록' },
  { week: 11, title: '변화 인정', topic: '성장 되돌아보기', exercise: '1주차와 비교해서 달라진 점 3가지 적기' },
  { week: 12, title: '선언하기', topic: '관계 선언문 완성', exercise: '나의 관계 원칙을 문장으로 완성하기' },
];

// #41 대화법/질문법 학습
const COMMUNICATION_SKILLS = [
  { id: 'i-message', title: 'I-메시지', desc: '"너는 왜 항상..."→ "나는 ...할 때 ...을 느껴"', example: '"네가 늦으면 화나" → "약속 시간이 지나면 걱정이 돼"' },
  { id: 'reflective', title: '반영적 경청', desc: '상대의 말을 자기 언어로 되돌려주기', example: '"그러니까 지금 서운한 거지?" → "네가 무시당한 느낌이 들었구나"' },
  { id: 'open-question', title: '열린 질문', desc: 'Yes/No가 아닌, 생각을 여는 질문하기', example: '"괜찮아?" → "지금 어떤 기분이야?"' },
  { id: 'boundary', title: '경계 언어', desc: '거절하면서도 관계를 유지하는 표현', example: '"싫어" → "그건 나에게 불편해. 대신 이건 어때?"' },
];

// #40 관계 결론 착지
const CLOSURE_STEPS = [
  { step: 1, title: '감정 인정', desc: '이 관계에서 느꼈던 모든 감정을 인정하세요' },
  { step: 2, title: '배움 추출', desc: '이 관계가 나에게 가르쳐준 것은 무엇인가요?' },
  { step: 3, title: '용서/놓아주기', desc: '상대와 나 자신을 용서하는 과정' },
  { step: 4, title: '의미 부여', desc: '이 경험이 나의 성장에 어떤 의미가 있나요?' },
  { step: 5, title: '앞으로', desc: '다음 관계에서 다르게 하고 싶은 것은?' },
];

type Section = 'coaching' | 'skills' | 'closure';

export default function RelationshipCoaching() {
  const [section, setSection] = useState<Section>('coaching');
  const [currentWeek, setCurrentWeek] = useState(0);

  return (
    <div className="space-y-4">
      {/* 섹션 탭 */}
      <div className="flex gap-1 bg-muted rounded-lg p-0.5">
        {([
          { key: 'coaching' as const, label: '12주 코칭' },
          { key: 'skills' as const, label: '대화법' },
          { key: 'closure' as const, label: '관계 정리' },
        ]).map(t => (
          <button key={t.key} onClick={() => setSection(t.key)}
            className={`flex-1 text-xs py-2 rounded-md transition-colors ${
              section === t.key ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* #37 12주 코칭 */}
      {section === 'coaching' && (
        <div className="space-y-3">
          <div className="bg-card border rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">WEEK {COACHING_WEEKS[currentWeek].week}</p>
              <span className="text-[10px] text-muted-foreground">{currentWeek + 1}/12</span>
            </div>
            <h3 className="font-semibold">{COACHING_WEEKS[currentWeek].title}</h3>
            <p className="text-xs text-muted-foreground">{COACHING_WEEKS[currentWeek].topic}</p>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
              <p className="text-[10px] text-primary font-medium mb-1">이번 주 실천</p>
              <p className="text-xs">{COACHING_WEEKS[currentWeek].exercise}</p>
            </div>
          </div>
          <div className="h-1.5 bg-muted rounded-full">
            <div className="h-1.5 bg-primary rounded-full" style={{ width: `${((currentWeek + 1) / 12) * 100}%` }} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCurrentWeek(w => Math.max(0, w - 1))} disabled={currentWeek === 0}
              className="flex-1 text-xs py-2 border rounded-lg disabled:opacity-30">이전 주</button>
            <button onClick={() => setCurrentWeek(w => Math.min(11, w + 1))} disabled={currentWeek === 11}
              className="flex-1 text-xs py-2 bg-primary text-white rounded-lg disabled:opacity-30">다음 주</button>
          </div>
        </div>
      )}

      {/* #41 대화법/질문법 */}
      {section === 'skills' && (
        <div className="space-y-2">
          {COMMUNICATION_SKILLS.map(skill => (
            <div key={skill.id} className="bg-card border rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium">{skill.title}</p>
              <p className="text-xs text-muted-foreground">{skill.desc}</p>
              <div className="bg-muted/50 rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground mb-0.5">예시</p>
                <p className="text-xs">{skill.example}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* #40 관계 결론 착지 */}
      {section === 'closure' && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">관계를 정리하고 의미를 찾아가는 5단계</p>
          {CLOSURE_STEPS.map(step => (
            <div key={step.step} className="bg-card border rounded-xl p-4 flex gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                {step.step}
              </div>
              <div>
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
