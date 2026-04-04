import { VFILE_QUESTIONS } from '@/data/vfileQuestions';
import type { AxisScores } from '@/context/AuthContext';

// ── 멀티페르소나 컨텍스트 ─────────────────────────────────────────
export type VFileContext = 'social' | 'general' | 'secret';

export const VFILE_CONTEXT_LABELS: Record<VFileContext, { ko: string; desc: string; icon: string }> = {
  general: { ko: '일반적인 나', desc: '평소의 나, 가장 자연스러운 상태', icon: '🌿' },
  social:  { ko: '사회적인 나', desc: '직장·모임에서 보여주는 나', icon: '🏢' },
  secret:  { ko: '비밀스러운 나', desc: '아무도 모르는, 가장 솔직한 나', icon: '🌙' },
};

// ── M43 확정 12종 가면 + MSK 코드 ──────────────────────────────────
export type MaskCategory = 'predatory' | 'prey';

export interface MaskProfile {
  id: string;
  mskCode: string;        // MSK 3자리 코드 (NRC, EMP, ...)
  nameKo: string;
  nameEn: string;
  category: MaskCategory; // 포식형/피식형
  archetype: string;
  description: string;
  scores: AxisScores;
  coreWound: string;
  coreFear: string;
  coreNeed: string;
  color: string;
  pairCode: string;       // 끌림 대칭 상대 MSK 코드
  genPath: string;        // 주요 생성 경로 (GEN)
}

export const MASK_PROFILES: MaskProfile[] = [
  // ── 포식형 6종 ──────────────────────────────────────────────────
  {
    id: 'controller', mskCode: 'PWR', nameKo: '통제자', nameEn: 'Controller',
    category: 'predatory',
    archetype: '불안 억제, 환경 장악',
    description: '당신은 관계에서 주도권을 잡으려 합니다. 환경을 통제해야 안전하다고 느끼고, 불확실함을 견디기 어렵습니다. 권력과 지위가 안전감의 원천입니다.',
    scores: { A: 20, B: 20, C: 25, D: 90 },
    coreWound: '무력했던 순간의 트라우마',
    coreFear: '통제를 잃으면 다시 무력해진다',
    coreNeed: '안전하게 주도권을 내려놓는 경험',
    color: '#9CA3AF',
    pairCode: 'SAV',
    genPath: '초기 불안정 애착',
  },
  {
    id: 'achiever', mskCode: 'NRC', nameKo: '공허자', nameEn: 'Void',
    category: 'predatory',
    archetype: '접근 차단, 고립 유지',
    description: '당신은 관계에서 접근을 차단합니다. 반복된 배신이 타인을 거울로 사용하게 만들었고, 고립이 유일한 안전지대가 되었습니다.',
    scores: { A: 15, B: 15, C: 15, D: 30 },
    coreWound: '반복된 배신이 신뢰를 파괴했다',
    coreFear: '다시 믿으면 다시 배신당한다',
    coreNeed: '배신 없이 존재할 수 있는 관계',
    color: '#6B7280',
    pairCode: 'EMP',
    genPath: '반복 배신 학습',
  },
  {
    id: 'rebel', mskCode: 'SCP', nameKo: '반항자', nameEn: 'Rebel',
    category: 'predatory',
    archetype: '경계 표시, 자율성 확보',
    description: '당신은 사회적 규칙을 인지하지만 내면화하지 않습니다. 자율성이 최우선이고, 누구도 당신을 가두지 못합니다.',
    scores: { A: 20, B: 70, C: 75, D: 70 },
    coreWound: '억압적 환경에서 자아가 짓밟혔다',
    coreFear: '규칙을 따르면 나를 잃는다',
    coreNeed: '자유와 연결이 공존하는 관계',
    color: '#EF4444',
    pairCode: 'DEP',
    genPath: '억압적 환경 저항',
  },
  {
    id: 'charmer', mskCode: 'MKV', nameKo: '매혹자', nameEn: 'Charmer',
    category: 'predatory',
    archetype: '욕망 유발, 권력 확보',
    description: '당신은 관계를 전략적으로 설계합니다. 매력과 감각적 자원을 자연스럽게 활용하지만, 진짜 자신이 드러나는 것은 두렵습니다.',
    scores: { A: 55, B: 75, C: 85, D: 80 },
    coreWound: '있는 그대로의 나는 매력적이지 않다',
    coreFear: '매력이 없으면 관계가 사라진다',
    coreNeed: '가면 없이도 원하는 존재',
    color: '#C084FC',
    pairCode: 'APV',
    genPath: '성적 자본 각성',
  },
  {
    id: 'player', mskCode: 'MNY', nameKo: '유희자', nameEn: 'Player',
    category: 'predatory',
    archetype: '긴장 해소, 접근 허용',
    description: '당신은 유머와 자원으로 관계의 구조를 만듭니다. 긴장을 해소하고 접근을 허용하지만, 그 이면에는 회피 전략이 숨어 있습니다.',
    scores: { A: 25, B: 30, C: 75, D: 90 },
    coreWound: '진지하면 다칠 수 있다는 것을 배웠다',
    coreFear: '감정을 가지면 통제력을 잃는다',
    coreNeed: '안전하게 감정을 가질 수 있는 관계',
    color: '#F59E0B',
    pairCode: 'GVR',
    genPath: '회피 전략 유머화',
  },
  {
    id: 'explorer', mskCode: 'PSP', nameKo: '탐험자', nameEn: 'Explorer',
    category: 'predatory',
    archetype: '자극 추구, 경계 실험',
    description: '당신은 새로운 경험과 경계의 실험을 추구합니다. 정서적 연결보다 자극이 관계의 동력이 됩니다.',
    scores: { A: 85, B: 80, C: 85, D: 80 },
    coreWound: '안전기지가 없었다',
    coreFear: '멈추면 공허함과 마주해야 한다',
    coreNeed: '떠나지 않는다는 확신',
    color: '#A78BFA',
    pairCode: 'AVD',
    genPath: '안전기지 부재',
  },

  // ── 피식형 6종 ──────────────────────────────────────────────────
  {
    id: 'mirror', mskCode: 'EMP', nameKo: '거울', nameEn: 'Mirror',
    category: 'prey',
    archetype: '융합, 자기 소거',
    description: '당신은 타인의 감정을 자신의 것처럼 느낍니다. 경계가 사라지고, 상대와 융합하면서 자기를 소거합니다.',
    scores: { A: 75, B: 25, C: 20, D: 15 },
    coreWound: '나 자신으로 있으면 사랑받지 못한다',
    coreFear: '존재 자체로 충분하지 않을지 모른다',
    coreNeed: '있는 그대로 받아들여지는 경험',
    color: '#8B9EFF',
    pairCode: 'NRC',
    genPath: '정체성 취약',
  },
  {
    id: 'caregiver', mskCode: 'GVR', nameKo: '돌봄자', nameEn: 'Caregiver',
    category: 'prey',
    archetype: '관계 유지, 거절 회피',
    description: '당신은 끊임없이 주는 것이 사랑이라고 믿습니다. 경계를 설정하지 못하고, 내 필요를 말하면 짐이 된다고 느낍니다.',
    scores: { A: 75, B: 75, C: 30, D: 25 },
    coreWound: '내 필요를 말하면 짐이 된다',
    coreFear: '내가 주지 않으면 상대는 떠난다',
    coreNeed: '받는 것도 괜찮다는 허락',
    color: '#F9A8D4',
    pairCode: 'MNY',
    genPath: '역할 역전 아동기',
  },
  {
    id: 'striver', mskCode: 'APV', nameKo: '성취자', nameEn: 'Striver',
    category: 'prey',
    archetype: '가치 증명, 인정 획득',
    description: '당신은 인정받을 때만 자신이 존재한다고 느낍니다. 완벽해야 사랑받을 수 있다는 믿음이 관계 패턴을 형성합니다.',
    scores: { A: 70, B: 75, C: 30, D: 75 },
    coreWound: '잘해야만 사랑받을 수 있었다',
    coreFear: '평범한 내가 드러나면 가치를 잃는다',
    coreNeed: '성취 없이도 사랑받는 경험',
    color: '#F5C842',
    pairCode: 'MKV',
    genPath: '조건부 사랑 경험',
  },
  {
    id: 'victim', mskCode: 'DEP', nameKo: '희생자', nameEn: 'Victim',
    category: 'prey',
    archetype: '보호 유발, 책임 회피',
    description: '당신은 홀로 존재하는 것이 불가능합니다. 상대가 있어야 완성되고, 무력감이 보호를 유발하는 전략이 되었습니다.',
    scores: { A: 80, B: 80, C: 70, D: 20 },
    coreWound: '혼자서는 아무것도 할 수 없었다',
    coreFear: '혼자 남겨지면 무너진다',
    coreNeed: '혼자서도 괜찮다는 경험',
    color: '#7DD3F0',
    pairCode: 'SCP',
    genPath: '무력감 학습',
  },
  {
    id: 'sage', mskCode: 'AVD', nameKo: '현자', nameEn: 'Sage',
    category: 'prey',
    archetype: '우월성 확보, 친밀감 회피',
    description: '당신은 지적 우월로 관계를 유지하면서 동시에 친밀감을 회피합니다. 감정을 드러내는 것을 약함으로 여깁니다.',
    scores: { A: 60, B: 25, C: 25, D: 25 },
    coreWound: '감정을 드러냈을 때 무시당했다',
    coreFear: '명확히 말하면 관계가 깨진다',
    coreNeed: '명확함이 안전하다는 경험',
    color: '#B5C4D3',
    pairCode: 'PSP',
    genPath: '지적 철수 패턴',
  },
  {
    id: 'martyr', mskCode: 'SAV', nameKo: '순교자', nameEn: 'Martyr',
    category: 'prey',
    archetype: '도덕적 우위, 죄책감 유발',
    description: '당신은 누군가를 구해야 자신의 가치를 증명할 수 있습니다. 희생이 미덕이라고 학습했고, 그것이 관계의 유일한 방식이 되었습니다.',
    scores: { A: 65, B: 75, C: 75, D: 30 },
    coreWound: '나의 가치는 남을 구할 때만 증명된다',
    coreFear: '도움이 필요 없는 상대는 나를 필요로 하지 않는다',
    coreNeed: '구원자가 아니어도 사랑받는 경험',
    color: '#93C5FD',
    pairCode: 'PWR',
    genPath: '종교/문화적 규범',
  },
];

// 빠진 2종: 유희자(8), 순교자(9) 외의 현자(7), 탐험자(10)는 위에 포함됨
// 참고: data_source = 'priper' (원본 출처 추적용)

// ── 끌림 대칭 쌍 ────────────────────────────────────────────────────
export const ATTRACTION_PAIRS: { predatory: string; prey: string; dynamic: string; longTerm: string }[] = [
  { predatory: 'NRC', prey: 'EMP', dynamic: '확인 공급 ↔ 공감 소모', longTerm: '피식형 고갈' },
  { predatory: 'MKV', prey: 'APV', dynamic: '조작 설계 ↔ 인정 갈망', longTerm: '통제 구조 고착' },
  { predatory: 'SCP', prey: 'DEP', dynamic: '무규범 ↔ 의존 필요', longTerm: '불안정 반복' },
  { predatory: 'PWR', prey: 'SAV', dynamic: '통제 ↔ 구원 욕구', longTerm: '구원자 소진' },
  { predatory: 'MNY', prey: 'GVR', dynamic: '경제력 통제 ↔ 기버 수용', longTerm: '불균형 공식화' },
  { predatory: 'PSP', prey: 'AVD', dynamic: '자극 추구 ↔ 감정 회피', longTerm: '감정 철수 심화' },
];

// ── 유클리드 거리 ────────────────────────────────────────────────────
function euclidean(a: AxisScores, b: AxisScores): number {
  return Math.sqrt(
    (a.A - b.A) ** 2 + (a.B - b.B) ** 2 + (a.C - b.C) ** 2 + (a.D - b.D) ** 2
  );
}

// ── 4축 점수 계산 ────────────────────────────────────────────────────
export function calculateAxisScores(responses: Record<string, number>): AxisScores {
  const sums: Record<string, number[]> = { A: [], B: [], C: [], D: [] };

  for (const q of VFILE_QUESTIONS) {
    const raw = responses[q.id];
    if (raw === undefined || raw === null) continue;
    const clamped = Math.max(0, Math.min(100, raw));
    const score = q.reversed ? 100 - clamped : clamped;
    sums[q.axis].push(score);
  }

  const avg = (arr: number[]) =>
    arr.length === 0 ? 50 : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

  return { A: avg(sums.A), B: avg(sums.B), C: avg(sums.C), D: avg(sums.D) };
}

// ── 가면 매핑 ────────────────────────────────────────────────────────
export function findMasks(scores: AxisScores): {
  primary: MaskProfile;
  secondary: MaskProfile;
  isComplex: boolean;
} {
  const ranked = [...MASK_PROFILES]
    .map(m => ({ mask: m, dist: euclidean(scores, m.scores) }))
    .sort((a, b) => a.dist - b.dist);

  return {
    primary: ranked[0].mask,
    secondary: ranked[1].mask,
    isComplex: ranked[1].dist - ranked[0].dist <= 10,
  };
}

// ── 인사이트 3개 생성 ────────────────────────────────────────────────
export function generateInsights(
  scores: AxisScores,
  primary: MaskProfile,
  secondary: MaskProfile,
  isComplex: boolean
): string[] {
  const axisName = { A: '애착', B: '소통', C: '욕구표현', D: '역할' };
  const axisLabel = {
    A: scores.A >= 70 ? '불안 애착' : scores.A <= 30 ? '회피 애착' : '혼합 애착',
    B: scores.B >= 65 ? '개방적 소통' : scores.B <= 35 ? '폐쇄적 소통' : '선택적 소통',
    C: scores.C >= 65 ? '표현형 욕구' : scores.C <= 35 ? '억압형 욕구' : '상황적 표현',
    D: scores.D >= 65 ? '주도형 역할' : scores.D <= 35 ? '수용형 역할' : '유동적 역할',
  };

  const extreme = (['A', 'B', 'C', 'D'] as (keyof AxisScores)[]).reduce((p, c) =>
    Math.abs(scores[c] - 50) > Math.abs(scores[p] - 50) ? c : p
  );

  const balanced = (['A', 'B', 'C', 'D'] as (keyof AxisScores)[]).reduce((p, c) =>
    Math.abs(scores[c] - 50) < Math.abs(scores[p] - 50) ? c : p
  );

  const categoryLabel = primary.category === 'predatory' ? '포식형' : '피식형';
  const pairMask = MASK_PROFILES.find(m => m.mskCode === primary.pairCode);

  return [
    `가장 두드러진 축은 ${axisName[extreme]}(${axisLabel[extreme]})입니다. 이것이 ${primary.nameKo}(${primary.mskCode}) 가면의 핵심 동력이 됩니다.`,
    `${primary.nameKo}의 밑바닥에는 "${primary.coreWound}"라는 상처가 있습니다. 이로 인해 "${primary.coreFear}"라는 두려움이 관계 패턴을 형성하고 있습니다. 당신의 가면은 ${categoryLabel}입니다.`,
    isComplex
      ? `당신의 점수는 ${primary.nameKo}(${primary.mskCode})와 ${secondary.nameKo}(${secondary.mskCode})의 경계에 위치합니다. 지금 당신에게 가장 필요한 것은 "${primary.coreNeed}"입니다.`
      : `${axisName[balanced]} 영역(${axisLabel[balanced]})은 상대적으로 유연하게 작동하고 있습니다.${pairMask ? ` ${pairMask.nameKo}(${pairMask.mskCode}) 유형과의 관계에서 끌림을 느낄 수 있습니다.` : ''} 지금 당신에게 가장 필요한 것은 "${primary.coreNeed}"입니다.`,
  ];
}

// ── 전체 분석 실행 ───────────────────────────────────────────────────
export interface DiagnosisResult {
  scores: AxisScores;
  primary: MaskProfile;
  secondary: MaskProfile;
  isComplex: boolean;
  insights: string[];
  dataSource: 'priper';
  context: VFileContext;
}

export function runDiagnosis(
  responses: Record<string, number>,
  context: VFileContext = 'general',
): DiagnosisResult {
  const scores = calculateAxisScores(responses);
  const { primary, secondary, isComplex } = findMasks(scores);
  const insights = generateInsights(scores, primary, secondary, isComplex);
  return { scores, primary, secondary, isComplex, insights, dataSource: 'priper', context };
}
