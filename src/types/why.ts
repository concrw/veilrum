// WhyFlow 관련 타입 및 상수

export interface WhySession {
  id: string;
  status: string;
  current_step: number;
  timer_started_at: string | null;
  timer_ended_at: string | null;
  prime_perspective: string | null;
  happy_patterns: Record<string, unknown> | null;
  pain_patterns: Record<string, unknown> | null;
  value_alignment: Record<string, unknown> | null;
  completed_at: string | null;
  // M43 integration fields (stored in DB but not in generated types)
  m43_domain_matches?: unknown[];
  m43_framework_tags?: unknown[];
  m43_imprint_connections?: unknown[];
  m43_value_map?: unknown[];
}

export interface JobEntry {
  id: string;
  job_name: string;
  definition: string | null;
  first_memory: string | null;
  category: 'happy' | 'pain' | 'neutral' | null;
  reason: string | null;
  has_experience: boolean;
  experience_note: string | null;
  sort_order: number;
}

export interface AnalysisResult {
  happy_patterns: {
    jobs: string[];
    keywords: string[];
  };
  pain_patterns: {
    jobs: string[];
    keywords: string[];
  };
  value_alignment: Record<string, unknown> | null;
  prime_perspective?: string;
}

export const TIMER_SECONDS = 600; // 10분

export const STEP_LABELS = [
  '준비',
  '직업 브레인스토밍',
  '직업 정의',
  '각인 순간',
  '행복/고통 분류',
  '이유 작성',
  '경험 여부',
  '1차 분석',
  '각인 연결',
  '가치관 매핑',
  'Prime Perspective',
];
