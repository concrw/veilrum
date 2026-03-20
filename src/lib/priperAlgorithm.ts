import { PRIPER_QUESTIONS } from '@/data/priperQuestions';
import type { AxisScores } from '@/context/AuthContext';

// ── 가면 12종 ───────────────────────────────────────────────────────
export interface MaskProfile {
  id: string;
  nameKo: string;
  nameEn: string;
  archetype: string;
  description: string;
  scores: AxisScores;
  coreWound: string;
  coreFear: string;
  coreNeed: string;
  color: string; // UI 강조색
}

export const MASK_PROFILES: MaskProfile[] = [
  {
    id: 'mirror', nameKo: '거울 가면', nameEn: 'Mirror Mask',
    archetype: '상대방 중심, 자기 지움',
    description: '당신은 관계에서 자신보다 상대방을 먼저 비춥니다. 상대의 감정과 반응이 당신의 기준점이 되고, 자신의 욕구는 뒤로 밀립니다.',
    scores: { A: 75, B: 25, C: 20, D: 15 },
    coreWound: '나 자신으로 있으면 사랑받지 못한다',
    coreFear: '존재 자체로 충분하지 않을지 모른다',
    coreNeed: '있는 그대로 받아들여지는 경험',
    color: '#8B9EFF',
  },
  {
    id: 'glass', nameKo: '유리 가면', nameEn: 'Glass Mask',
    archetype: '감정 과다표현, 경계 붕괴',
    description: '당신은 감정이 풍부하고 표현력이 강하지만, 그 감정이 때로 관계의 경계를 무너뜨립니다.',
    scores: { A: 80, B: 80, C: 70, D: 20 },
    coreWound: '감정이 너무 크다는 말을 들었다',
    coreFear: '감정을 보여주면 상대가 도망간다',
    coreNeed: '감정이 환영받는 안전한 공간',
    color: '#7DD3F0',
  },
  {
    id: 'iron', nameKo: '철 가면', nameEn: 'Iron Mask',
    archetype: '감정 차단, 독립 과시',
    description: '당신은 감정을 드러내는 것을 약함으로 여기며, 혼자서 충분하다는 것을 증명하려 합니다.',
    scores: { A: 20, B: 20, C: 25, D: 80 },
    coreWound: '의존했다가 배신당했다',
    coreFear: '필요를 드러내면 이용당한다',
    coreNeed: '안전하게 의존해도 되는 관계',
    color: '#9CA3AF',
  },
  {
    id: 'gold', nameKo: '황금 가면', nameEn: 'Gold Mask',
    archetype: '완벽주의, 인정 욕구',
    description: '당신은 관계에서 최선의 자신을 보여주려 합니다. 인정받고 싶은 욕구가 강하고, 실수나 약함을 드러내기 어렵습니다.',
    scores: { A: 70, B: 75, C: 30, D: 75 },
    coreWound: '잘해야만 사랑받을 수 있었다',
    coreFear: '평범한 내가 드러나면 가치를 잃는다',
    coreNeed: '성취 없이도 사랑받는 경험',
    color: '#F5C842',
  },
  {
    id: 'mist', nameKo: '안개 가면', nameEn: 'Mist Mask',
    archetype: '모호함, 결정 회피',
    description: '당신은 관계에서 불분명한 경계와 흐릿한 자기표현을 통해 안전을 유지합니다.',
    scores: { A: 60, B: 25, C: 25, D: 25 },
    coreWound: '선명하게 원하면 거절당했다',
    coreFear: '명확히 말하면 관계가 깨진다',
    coreNeed: '명확함이 안전하다는 경험',
    color: '#B5C4D3',
  },
  {
    id: 'velvet', nameKo: '벨벳 가면', nameEn: 'Velvet Mask',
    archetype: '매혹, 감각적 자원 활용',
    description: '당신은 관계에서 매력과 감각적 자원을 자연스럽게 활용합니다. 상대방을 끌어당기는 힘이 강하지만, 그 매력 너머의 진짜 자신이 드러나는 것은 두렵습니다.',
    scores: { A: 55, B: 75, C: 85, D: 80 },
    coreWound: '있는 그대로의 나는 매력적이지 않다',
    coreFear: '매력이 없으면 관계가 사라진다',
    coreNeed: '가면 없이도 원하는 존재',
    color: '#C084FC',
  },
  {
    id: 'butterfly', nameKo: '나비 가면', nameEn: 'Butterfly Mask',
    archetype: '자유 추구, 친밀 회피',
    description: '당신은 자유롭고 싶고, 관계가 당신을 가두는 것처럼 느껴질 때 날아가버립니다.',
    scores: { A: 20, B: 70, C: 75, D: 70 },
    coreWound: '친밀함이 나를 잃게 만들었다',
    coreFear: '깊이 연결되면 자유를 잃는다',
    coreNeed: '자유와 연결이 공존하는 관계',
    color: '#6EE7B7',
  },
  {
    id: 'stone', nameKo: '돌 가면', nameEn: 'Stone Mask',
    archetype: '무감각, 감정 봉쇄',
    description: '당신은 감정을 느끼지 않는 것처럼 보입니다. 오랜 시간 감정을 닫아온 결과, 지금은 무엇을 원하는지조차 알기 어려운 상태일 수 있습니다.',
    scores: { A: 15, B: 15, C: 15, D: 30 },
    coreWound: '감정을 드러냈을 때 무시당했다',
    coreFear: '다시 느끼기 시작하면 무너진다',
    coreNeed: '안전하게 녹아내릴 수 있는 공간',
    color: '#6B7280',
  },
  {
    id: 'flower', nameKo: '꽃 가면', nameEn: 'Flower Mask',
    archetype: '돌봄 과잉, 의존 유발',
    description: '당신은 관계에서 주는 사람입니다. 상대를 돌보는 것이 자연스럽고, 그것이 관계를 유지하는 방법이 되었습니다.',
    scores: { A: 75, B: 75, C: 30, D: 25 },
    coreWound: '내 필요를 말하면 짐이 된다',
    coreFear: '내가 주지 않으면 상대는 떠난다',
    coreNeed: '받는 것도 괜찮다는 허락',
    color: '#F9A8D4',
  },
  {
    id: 'eagle', nameKo: '독수리 가면', nameEn: 'Eagle Mask',
    archetype: '전략적 관계, 목적형',
    description: '당신은 관계를 명확하게 봅니다. 감정보다 구조와 목적이 앞서고, 관계의 손익을 계산하게 됩니다.',
    scores: { A: 25, B: 30, C: 75, D: 90 },
    coreWound: '순수하게 믿었다가 이용당했다',
    coreFear: '감정을 가지면 통제력을 잃는다',
    coreNeed: '안전하게 감정을 가질 수 있는 관계',
    color: '#FCA5A5',
  },
  {
    id: 'spider', nameKo: '거미 가면', nameEn: 'Spider Mask',
    archetype: '집착, 통제 욕구',
    description: '당신은 관계를 놓지 않으려 합니다. 상대방이 어디에 있는지 계속 확인해야 안심이 됩니다.',
    scores: { A: 85, B: 80, C: 85, D: 80 },
    coreWound: '사랑하는 사람이 예고 없이 사라졌다',
    coreFear: '통제를 놓으면 관계도 사라진다',
    coreNeed: '떠나지 않는다는 확신',
    color: '#A78BFA',
  },
  {
    id: 'moon', nameKo: '달 가면', nameEn: 'Moon Mask',
    archetype: '이상화/환멸 반복, 낭만적',
    description: '당신은 관계를 낭만적으로 이상화합니다. 처음엔 상대를 완벽하게 보다가, 어느 순간 환멸이 찾아옵니다.',
    scores: { A: 65, B: 75, C: 75, D: 30 },
    coreWound: '실망을 너무 많이 경험했다',
    coreFear: '현실의 관계는 이상에 못 미친다',
    coreNeed: '불완전함도 안을 수 있는 사랑',
    color: '#93C5FD',
  },
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

  for (const q of PRIPER_QUESTIONS) {
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

  return [
    `가장 두드러진 축은 ${axisName[extreme]}(${axisLabel[extreme]})입니다. 이것이 ${primary.nameKo}의 핵심 동력이 됩니다.`,
    `${primary.nameKo}의 밑바닥에는 "${primary.coreWound}"라는 상처가 있습니다. 이로 인해 "${primary.coreFear}"라는 두려움이 관계 패턴을 형성하고 있습니다.`,
    isComplex
      ? `당신의 점수는 ${primary.nameKo}와 ${secondary.nameKo}의 경계에 위치합니다. 지금 당신에게 가장 필요한 것은 "${primary.coreNeed}"입니다.`
      : `${axisName[balanced]} 영역(${axisLabel[balanced]})은 상대적으로 유연하게 작동하고 있습니다. 지금 당신에게 가장 필요한 것은 "${primary.coreNeed}"입니다.`,
  ];
}

// ── 전체 진단 실행 ───────────────────────────────────────────────────
export interface DiagnosisResult {
  scores: AxisScores;
  primary: MaskProfile;
  secondary: MaskProfile;
  isComplex: boolean;
  insights: string[];
}

export function runDiagnosis(responses: Record<string, number>): DiagnosisResult {
  const scores = calculateAxisScores(responses);
  const { primary, secondary, isComplex } = findMasks(scores);
  const insights = generateInsights(scores, primary, secondary, isComplex);
  return { scores, primary, secondary, isComplex, insights };
}
